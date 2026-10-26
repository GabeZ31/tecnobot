import os
import json
import uuid
import base64
import binascii
import boto3
import io
from PyPDF2 import PdfReader

from shared.db import DynamoDBClient

s3_client = boto3.client('s3')
cors_origin = os.environ.get('CORS_ORIGIN', '*')

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 100) -> list[str]:
    # Divide el texto en chunks con solapamiento
    chunks = []
    start = 0
    text_length = len(text)
    
    while start < text_length:
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
        
    return chunks

def lambda_handler(event, context):
    headers = {
        'Access-Control-Allow-Origin': cors_origin,
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }
    
    try:
        body = json.loads(event.get('body', '{}'))
        file_name = body.get('fileName')
        file_content_base64 = body.get('fileContent')
        
        if not isinstance(file_name, str) or not file_name.lower().endswith('.pdf'):
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'message': 'El archivo debe ser un PDF'})
            }

        if not isinstance(file_content_base64, str) or not file_content_base64:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'message': 'Falta fileName o fileContent'})
            }
            
        if ',' in file_content_base64:
            file_content_base64 = file_content_base64.split(',')[1]
            
        try:
            pdf_bytes = base64.b64decode(file_content_base64, validate=True)
        except (binascii.Error, ValueError):
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'message': 'El contenido del archivo no es válido'})
            }

        if len(pdf_bytes) > 15 * 1024 * 1024:
            return {
                'statusCode': 413,
                'headers': headers,
                'body': json.dumps({'message': 'El archivo excede el límite de 15MB'})
            }
        
        document_id = str(uuid.uuid4())
        bucket_name = os.environ.get('BUCKET_NAME')
        s3_key = f"{document_id}.pdf"
        
        pdf_file = io.BytesIO(pdf_bytes)
        reader = PdfReader(pdf_file)
        
        extracted_text = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                extracted_text.append(text)
                
        full_text = " ".join(extracted_text)

        if not full_text.strip():
            return {
                'statusCode': 422,
                'headers': headers,
                'body': json.dumps({'message': 'No se pudo extraer texto del PDF'})
            }
            
        chunks = chunk_text(full_text)

        s3_client.put_object(
            Bucket=bucket_name,
            Key=s3_key,
            Body=pdf_bytes,
            ContentType='application/pdf'
        )

        db = DynamoDBClient()
        db.save_chunks(document_id, chunks)
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'documentId': document_id,
                'chunks': len(chunks),
                'message': 'Documento procesado'
            })
        }
        
    except Exception as e:
        # Manejo de errores
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'message': f"Error interno: {str(e)}"
            })
        }
