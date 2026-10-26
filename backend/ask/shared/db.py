import os
import re
import boto3
from boto3.dynamodb.conditions import Key

class DynamoDBClient:
    def __init__(self):
        # Inicializa cliente DynamoDB usando variables de entorno
        self.table_name = os.environ.get('TABLE_NAME', 'TecnoBot-Documents')
        self.region = os.environ.get('REGION', 'us-east-1')
        self.dynamodb = boto3.resource('dynamodb', region_name=self.region)
        self.table = self.dynamodb.Table(self.table_name)

    def save_chunks(self, document_id: str, chunks: list[str]):
        # Guarda cada chunk con su respectivo índice
        with self.table.batch_writer() as batch:
            for i, chunk in enumerate(chunks):
                batch.put_item(
                    Item={
                        'documentId': document_id,
                        'chunkIndex': i,
                        'content': chunk
                    }
                )

    def get_chunks(self, document_id: str) -> list[str]:
        # Retorna todos los chunks de un documento ordenados por índice
        response = self.table.query(
            KeyConditionExpression=Key('documentId').eq(document_id)
        )
        items = response.get('Items', [])
        # Asegura que estén ordenados por chunkIndex
        items.sort(key=lambda x: int(x['chunkIndex']))
        return [item['content'] for item in items]

    def get_relevant_chunks(self, document_id: str, question: str, limit: int = 8) -> list[str]:
        chunks = self.get_chunks(document_id)
        question_words = self._important_words(question)
        if not question_words:
            return chunks[:limit]

        scored_chunks = []
        for index, chunk in enumerate(chunks):
            chunk_words = self._important_words(chunk)
            score = len(question_words.intersection(chunk_words))
            scored_chunks.append((score, -index, chunk))

        scored_chunks.sort(reverse=True)
        relevant = [chunk for score, _, chunk in scored_chunks[:limit] if score > 0]
        return relevant or chunks[:limit]

    @staticmethod
    def _important_words(text: str) -> set[str]:
        stop_words = {
            'para', 'como', 'donde', 'desde', 'este', 'esta', 'sobre',
            'entre', 'cual', 'cuales', 'que', 'una', 'unos', 'las',
            'los', 'del', 'con', 'por', 'sus', 'son'
        }
        words = re.findall(r'[a-záéíóúñü]{4,}', text.lower())
        return {word for word in words if word not in stop_words}

    def list_documents(self) -> list[str]:
        # Retorna lista de documentIds únicos escaneando la tabla
        response = self.table.scan(
            ProjectionExpression='documentId'
        )
        items = response.get('Items', [])
        # Usar un set para obtener IDs únicos
        document_ids = list(set([item['documentId'] for item in items]))
        return document_ids
