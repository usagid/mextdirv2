from __future__ import annotations

import argparse
import base64
import binascii
import hashlib
import io
import json
import logging
import os
import re
import time
import uuid
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit, urlunsplit

import psycopg
import requests
from mistralai.client import Mistral
from mistralai.extra import response_format_from_pydantic_model
from pydantic import BaseModel, Field
from pypdf import PdfReader, PdfWriter

SOURCE_PAGE_URL = "https://www.mext.go.jp/a_menu/shotou/zyosei/1394609.htm"
MEXT_PDF_PATTERN = re.compile(
    r"https://www\.mext\.go\.jp/content/\d{8}-mxt_sisetujo-100003131_(?P<part>\d+(?:-\d+)?)\.pdf$",
    re.IGNORECASE,
)
MAX_PAGES = 30
MAX_CHUNK_BYTES = 48 * 1024 * 1024
DEFAULT_INTERVAL_SECONDS = 24 * 60 * 60
DEFAULT_OCR_MODEL = "mistral-ocr-4-0"
USER_AGENT = "mextdir-importer/1.0 (+https://mextdir.example)"
LOGGER = logging.getLogger("mextdir-importer")


class OCRSchool(BaseModel):
    prefecture: str = Field(..., description="都道府県")
    city: str = Field(..., description="市区町村")
    school_name: str = Field(..., description="学校名")
    address: str = Field(..., description="所在地")
    closest_poi: str = Field(..., description="最寄りの目印")
    lister: str = Field(..., description="問い合わせ先の自治体または団体")
    phone_number: str = Field(..., description="電話番号")
    additional_contact: str = Field(..., description="メールアドレスまたはウェブサイト")
    zoning_info: str = Field(..., description="用途地域")
    land_info: str = Field(..., description="土地面積")
    structure_info: str = Field(..., description="構造")
    completion_info: str = Field(..., description="竣工年")
    facility_info: str = Field(..., description="施設区分")
    building_area: int = Field(..., description="建築面積。分からない場合は0")
    floor_area: int = Field(..., description="延床面積。分からない場合は0")
    floor_num: int = Field(..., description="階数。分からない場合は0")
    recruitment: str = Field(..., description="募集内容")
    conditions: str = Field(..., description="貸与・譲渡条件等")
    remarks: str = Field(..., description="備考")
    page_index: int = Field(0, description="このOCRチャンク内の1始まりのPDFページ番号")


class OCRSchoolList(BaseModel):
    schools: list[OCRSchool] = Field(..., description="このPDFページ範囲に掲載された学校施設")


ExtractedImage = tuple[str, bytes, str]


ANNOTATION_FORMAT = response_format_from_pydantic_model(OCRSchoolList)
ANNOTATION_PROMPT = """
このPDFページ範囲から、掲載されている廃校施設をすべて抽出してください。
学校施設1件につきschoolsの要素を1件だけ返してください。表の内容を組み合わせてください。
日本語の文字列は原文を保ち、推測や補完はしないでください。値がない文字列は空文字列、
値がない数値は0にしてください。建築面積、延床面積、階数は整数で返してください。
各学校のpage_indexには、このOCRチャンク内での1始まりのPDFページ番号を入れてください。
JSONだけを返し、説明文やMarkdownは含めないでください。
""".strip()


class MextLinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.links: list[str] = []
        self.stopped = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "a" and not self.stopped:
            href = dict(attrs).get("href")
            if href:
                self.links.append(href)

    def handle_data(self, data: str) -> None:
        if "地方公共団体" in data and "担当者" in data:
            self.stopped = True


def request_timeout() -> tuple[int, int]:
    return (20, 180)


def fetch_source_page(session: requests.Session) -> str:
    response = session.get(
        SOURCE_PAGE_URL,
        headers={"User-Agent": USER_AGENT},
        timeout=request_timeout(),
    )
    response.raise_for_status()
    response.encoding = response.apparent_encoding or response.encoding
    return response.text


def relevant_pdf_urls(html: str) -> list[str]:
    parser = MextLinkParser()
    parser.feed(html)
    urls: list[str] = []
    for href in parser.links:
        absolute = urljoin(SOURCE_PAGE_URL, href)
        parts = urlsplit(absolute)
        normalized = urlunsplit((parts.scheme, parts.netloc, parts.path, "", ""))
        match = MEXT_PDF_PATTERN.fullmatch(normalized)
        if match and match.group("part") != "00":
            urls.append(normalized)
    return list(dict.fromkeys(urls))


def download_pdf(session: requests.Session, url: str) -> bytes:
    LOGGER.info("Downloading %s", url)
    response = session.get(
        url,
        headers={"User-Agent": USER_AGENT},
        timeout=request_timeout(),
    )
    response.raise_for_status()
    if not response.content.startswith(b"%PDF"):
        raise ValueError(f"MEXT returned a non-PDF response for {url}")
    return response.content


def pdf_chunk_bytes(reader: PdfReader, start: int, end: int) -> bytes:
    writer = PdfWriter()
    for page_index in range(start, end):
        writer.add_page(reader.pages[page_index])
    output = io.BytesIO()
    writer.write(output)
    return output.getvalue()


def split_pdf(pdf_bytes: bytes) -> list[tuple[int, bytes]]:
    reader = PdfReader(io.BytesIO(pdf_bytes))
    if reader.is_encrypted and reader.decrypt("") == 0:
        raise ValueError("Could not decrypt the MEXT PDF")

    chunks: list[tuple[int, bytes]] = []
    start = 0
    while start < len(reader.pages):
        end = min(start + MAX_PAGES, len(reader.pages))
        while True:
            chunk = pdf_chunk_bytes(reader, start, end)
            if len(chunk) <= MAX_CHUNK_BYTES:
                break
            if end - start == 1:
                raise ValueError(
                    f"MEXT PDF page {start + 1} exceeds the {MAX_CHUNK_BYTES} byte limit"
                )
            end -= 1
        chunks.append((start, chunk))
        start = end
    return chunks


def parse_json_annotation(value: object) -> dict[str, object]:
    if isinstance(value, BaseModel):
        value = value.model_dump()
    if isinstance(value, str):
        value = value.strip()
        if value.startswith("```"):
            value = re.sub(r"^```(?:json)?\s*|\s*```$", "", value, flags=re.IGNORECASE)
        try:
            value = json.loads(value)
        except json.JSONDecodeError as error:
            raise ValueError("Mistral returned invalid annotation JSON") from error
    if not isinstance(value, dict):
        raise ValueError("Mistral returned an invalid document annotation")
    return value


def annotation_from_response(response: object) -> dict[str, object]:
    annotation = getattr(response, "document_annotation", None)
    if annotation is None and isinstance(response, BaseModel):
        annotation = response.model_dump().get("document_annotation")
    return parse_json_annotation(annotation)


def ocr_image_value(image: object, key: str) -> object:
    if isinstance(image, BaseModel):
        return image.model_dump().get(key)
    if isinstance(image, dict):
        return image.get(key)
    return getattr(image, key, None)


def decode_ocr_image(image: object, index: int) -> ExtractedImage | None:
    image_data = ocr_image_value(image, "image_base64")
    if not isinstance(image_data, str) or not image_data.startswith("data:"):
        return None
    header, separator, encoded = image_data.partition(",")
    if separator != "," or ";base64" not in header:
        return None
    mime_type = header[5:].split(";", 1)[0].lower()
    if mime_type not in {"image/jpeg", "image/png", "image/webp", "image/gif"}:
        return None
    try:
        data = base64.b64decode(re.sub(r"\s+", "", encoded), validate=True)
    except (binascii.Error, ValueError):
        LOGGER.warning("Mistral returned invalid base64 for image %d", index)
        return None
    extension = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
    }[mime_type]
    return (f"mext-image-{index}{extension}", data, mime_type)


def clean_text(value: object) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    return "" if text in {"—", "－", "-", "ー", "N/A", "なし"} else text


def clean_integer(value: object) -> int:
    if isinstance(value, bool):
        return 0
    if isinstance(value, int):
        return max(0, value)
    match = re.search(r"\d+(?:\.\d+)?", clean_text(value).replace(",", ""))
    if not match:
        return 0
    try:
        return max(0, int(float(match.group())))
    except (ValueError, OverflowError):
        return 0


def normalize_school(raw: object) -> OCRSchool:
    if not isinstance(raw, dict):
        raise ValueError("Mistral returned a non-object school")

    return OCRSchool.model_validate(
        {
            "prefecture": clean_text(raw.get("prefecture")),
            "city": clean_text(raw.get("city")),
            "school_name": clean_text(raw.get("school_name")),
            "address": clean_text(raw.get("address")),
            "closest_poi": clean_text(raw.get("closest_poi")),
            "lister": clean_text(raw.get("lister")) or "MEXT「みんなの廃校」プロジェクト",
            "phone_number": clean_text(raw.get("phone_number")),
            "additional_contact": clean_text(raw.get("additional_contact")),
            "zoning_info": clean_text(raw.get("zoning_info")),
            "land_info": clean_text(raw.get("land_info")),
            "structure_info": clean_text(raw.get("structure_info")),
            "completion_info": clean_text(raw.get("completion_info")),
            "facility_info": clean_text(raw.get("facility_info")),
            "building_area": clean_integer(raw.get("building_area")),
            "floor_area": clean_integer(raw.get("floor_area")),
            "floor_num": clean_integer(raw.get("floor_num")),
            "recruitment": clean_text(raw.get("recruitment", raw.get("recreuitment"))),
            "conditions": clean_text(raw.get("conditions")),
            "remarks": clean_text(raw.get("remarks")),
            "page_index": clean_integer(raw.get("page_index")),
        }
    )


def source_key(pdf_url: str, page_number: int) -> str:
    match = MEXT_PDF_PATTERN.fullmatch(pdf_url)
    if not match:
        raise ValueError(f"Unsupported MEXT PDF URL: {pdf_url}")
    return f"mext:{match.group('part')}:{page_number}"


def schools_from_annotation(annotation: dict[str, object]) -> list[OCRSchool]:
    raw_schools = annotation.get("schools", [])
    if not isinstance(raw_schools, list):
        raise ValueError("Mistral annotation did not contain a schools list")
    schools: list[OCRSchool] = []
    for raw_school in raw_schools:
        school = normalize_school(raw_school)
        if not school.prefecture or not school.city or not school.school_name or not school.address:
            LOGGER.warning("Skipping incomplete OCR record: %s", school.school_name)
            continue
        schools.append(school)
    return schools


def process_pdf_chunk(
    client: Mistral, pdf_bytes: bytes
) -> list[tuple[OCRSchool, list[ExtractedImage]]]:
    encoded = base64.b64encode(pdf_bytes).decode("ascii")
    response = client.ocr.process(
        model=os.getenv("MISTRAL_OCR_MODEL", DEFAULT_OCR_MODEL),
        document={
            "type": "document_url",
            "document_url": f"data:application/pdf;base64,{encoded}",
        },
        document_annotation_format=ANNOTATION_FORMAT,
        document_annotation_prompt=ANNOTATION_PROMPT,
        include_image_base64=True,
        include_blocks=True,
    )
    schools = schools_from_annotation(annotation_from_response(response))
    pages = list(response.pages)
    images_by_page = [
        [
            decoded
            for image_index, image in enumerate(page.images)
            if (decoded := decode_ocr_image(image, image_index)) is not None
        ]
        for page in pages
    ]

    declared_pages = [school.page_index for school in schools]
    if (
        declared_pages
        and len(set(declared_pages)) == len(declared_pages)
        and all(1 <= page_index <= len(pages) for page_index in declared_pages)
    ):
        return [
            (school, images_by_page[school.page_index - 1])
            for school in schools
        ]
    if len(schools) == len(pages):
        return [
            (school.model_copy(update={"page_index": index + 1}), images)
            for index, (school, images) in enumerate(zip(schools, images_by_page))
        ]
    LOGGER.warning(
        "Could not safely map %d OCR schools to %d OCR pages; importing without images",
        len(schools),
        len(pages),
    )
    return [(school, []) for school in schools]


SQL_UPSERT = """
INSERT INTO "School" (
  "id", "sourceKey", "prefecture", "city", "schoolName", "address", "closestPoi", "lister",
  "phoneNumber", "additionalContact", "zoningInfo", "landInfo", "structureInfo",
  "completionInfo", "facilityInfo", "buildingArea", "floorArea", "floorNum",
  "recruitment", "conditions", "remarks", "createdAt", "updatedAt"
) VALUES (
  %(id)s, %(source_key)s, %(prefecture)s, %(city)s, %(school_name)s, %(address)s, %(closest_poi)s, %(lister)s,
  %(phone_number)s, %(additional_contact)s, %(zoning_info)s, %(land_info)s, %(structure_info)s,
  %(completion_info)s, %(facility_info)s, %(building_area)s, %(floor_area)s, %(floor_num)s,
  %(recruitment)s, %(conditions)s, %(remarks)s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT ("sourceKey") DO UPDATE SET
  "prefecture" = EXCLUDED."prefecture",
  "city" = EXCLUDED."city",
  "schoolName" = EXCLUDED."schoolName",
  "address" = EXCLUDED."address",
  "closestPoi" = EXCLUDED."closestPoi",
  "lister" = EXCLUDED."lister",
  "phoneNumber" = EXCLUDED."phoneNumber",
  "additionalContact" = EXCLUDED."additionalContact",
  "zoningInfo" = EXCLUDED."zoningInfo",
  "landInfo" = EXCLUDED."landInfo",
  "structureInfo" = EXCLUDED."structureInfo",
  "completionInfo" = EXCLUDED."completionInfo",
  "facilityInfo" = EXCLUDED."facilityInfo",
  "buildingArea" = EXCLUDED."buildingArea",
  "floorArea" = EXCLUDED."floorArea",
  "floorNum" = EXCLUDED."floorNum",
  "recruitment" = EXCLUDED."recruitment",
  "conditions" = EXCLUDED."conditions",
  "remarks" = EXCLUDED."remarks",
  "updatedAt" = CURRENT_TIMESTAMP
"""


def database_url() -> str:
    url = os.environ["DATABASE_URL"]
    return re.sub(r"([?&])schema=public", "", url).replace("?&", "?").rstrip("?")


def env_integer(name: str, fallback: int) -> int:
    try:
        return int(os.getenv(name, str(fallback)))
    except ValueError:
        LOGGER.warning("Invalid integer in %s; using %d", name, fallback)
        return fallback


def wait_for_schema() -> None:
    deadline = time.monotonic() + env_integer("MEXT_DB_WAIT_SECONDS", 300)
    while time.monotonic() < deadline:
        try:
            with psycopg.connect(database_url(), connect_timeout=5) as connection:
                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'School' AND column_name = 'sourceKey'
                        """
                    )
                    if cursor.fetchone():
                        return
        except Exception as error:
            LOGGER.info("Waiting for PostgreSQL/migrations: %s", error)
        time.sleep(5)
    raise TimeoutError("PostgreSQL or the mextdir schema was not ready")


def upsert_schools(records: list[tuple[str, OCRSchool]], dry_run: bool) -> None:
    if dry_run:
        LOGGER.info("Dry run: would upsert %d schools", len(records))
        return

    wait_for_schema()
    with psycopg.connect(database_url()) as connection:
        with connection.cursor() as cursor:
            for key, school in records:
                values = school.model_dump()
                values.pop("page_index", None)
                values["id"] = str(uuid.uuid4())
                values["source_key"] = key
                cursor.execute(SQL_UPSERT, values)
    LOGGER.info("Upserted %d schools", len(records))


def image_source_key(school_key: str, index: int, data: bytes) -> str:
    digest = hashlib.sha256(data).hexdigest()
    return f"{school_key}:image:{index}:{digest}"


def upload_images(
    session: requests.Session,
    records: list[tuple[str, OCRSchool, list[ExtractedImage]]],
    dry_run: bool,
) -> None:
    image_count = sum(len(images) for _, _, images in records)
    if dry_run:
        LOGGER.info(
            "Dry run: would sync %d images for %d schools",
            image_count,
            len(records),
        )
        return

    secret = os.getenv("MEXT_IMPORT_SECRET")
    if not secret:
        raise RuntimeError("MEXT_IMPORT_SECRET is required to sync images")

    manifest: list[dict[str, object]] = []
    files = []
    file_index = 0
    for school_key, _, images in records:
        manifest_images: list[dict[str, str]] = []
        for index, (filename, data, mime_type) in enumerate(images):
            field = f"image_{file_index}"
            manifest_images.append(
                {
                    "field": field,
                    "sourceKey": image_source_key(school_key, index, data),
                }
            )
            files.append((field, (filename, data, mime_type)))
            file_index += 1
        manifest.append({"sourceKey": school_key, "images": manifest_images})

    files.insert(
        0,
        (
            "manifest",
            (None, json.dumps(manifest, ensure_ascii=False), "application/json"),
        ),
    )
    app_url = os.getenv("MEXT_APP_URL", "http://mextdir:3000").rstrip("/")
    response = session.post(
        f"{app_url}/api/internal/mext-import/images",
        files=files,
        headers={"x-mext-import-secret": secret},
        timeout=request_timeout(),
    )
    response.raise_for_status()
    LOGGER.info(
        "Synced %d images for %d schools",
        image_count,
        len(records),
    )


def run_once(
    session: requests.Session,
    client: Mistral,
    dry_run: bool,
    pdf_index: int | None = None,
) -> None:
    urls = relevant_pdf_urls(fetch_source_page(session))
    if not urls:
        raise RuntimeError("No relevant MEXT PDFs found")
    if pdf_index is not None:
        if not 1 <= pdf_index <= len(urls):
            raise ValueError(f"PDF index must be between 1 and {len(urls)}")
        urls = [urls[pdf_index - 1]]
    LOGGER.info("Processing %d relevant MEXT PDF(s)", len(urls))

    total = 0
    for pdf_url in urls:
        chunks = split_pdf(download_pdf(session, pdf_url))
        LOGGER.info("%s has %d OCR chunk(s)", pdf_url, len(chunks))
        for chunk_index, (chunk_start, pdf_bytes) in enumerate(chunks, 1):
            LOGGER.info("OCR %s chunk %d/%d", pdf_url, chunk_index, len(chunks))
            record_map: dict[str, tuple[OCRSchool, list[ExtractedImage]]] = {}
            for record_index, (school, images) in enumerate(
                process_pdf_chunk(client, pdf_bytes), 1
            ):
                page_index = school.page_index or record_index
                key = source_key(pdf_url, chunk_start + page_index)
                record_map[key] = (school, images)
            chunk_records = [
                (key, school, images)
                for key, (school, images) in record_map.items()
            ]
            upsert_schools([(key, school) for key, school, _ in chunk_records], dry_run)
            upload_images(session, chunk_records, dry_run)
            total += len(chunk_records)
    LOGGER.info("MEXT import complete: %d school records processed", total)


def boolean_env(name: str, default: bool) -> bool:
    value = os.getenv(name)
    return default if value is None else value.lower() in {"1", "true", "yes", "on"}


def main() -> None:
    parser = argparse.ArgumentParser(description="Import MEXT abandoned-school PDFs into mextdir")
    parser.add_argument("--once", action="store_true", help="Run one import and exit")
    parser.add_argument("--dry-run", action="store_true", help="OCR but do not write to PostgreSQL")
    parser.add_argument("--list-links", action="store_true", help="Print current relevant MEXT PDF links and exit")
    parser.add_argument("--pdf-index", type=int, help="Process one relevant PDF by its 1-based link index")
    args = parser.parse_args()

    logging.basicConfig(
        level=os.getenv("LOG_LEVEL", "INFO").upper(),
        format="%(asctime)s %(levelname)s %(message)s",
    )
    session = requests.Session()
    if args.list_links:
        for url in relevant_pdf_urls(fetch_source_page(session)):
            print(url)
        return

    api_key = os.getenv("MISTRAL_API_KEY")
    if not api_key:
        raise RuntimeError("MISTRAL_API_KEY is required")

    with Mistral(api_key=api_key) as client:
        if args.once:
            run_once(session, client, args.dry_run, args.pdf_index)
            return

        if boolean_env("MEXT_IMPORT_RUN_ON_START", True):
            try:
                run_once(session, client, args.dry_run, args.pdf_index)
            except Exception:
                LOGGER.exception("Initial MEXT import failed; the scheduled retry will continue")

        interval = max(60, env_integer("MEXT_IMPORT_INTERVAL_SECONDS", DEFAULT_INTERVAL_SECONDS))
        while True:
            time.sleep(interval)
            try:
                run_once(session, client, args.dry_run, args.pdf_index)
            except Exception:
                LOGGER.exception("Scheduled MEXT import failed")


if __name__ == "__main__":
    main()
