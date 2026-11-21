const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function createDocumentModel() {
  const storage = new Map();
  const localStorage = {
    getItem(key) {
      return storage.has(key) ? storage.get(key) : null;
    },
    setItem(key, value) {
      storage.set(key, String(value));
    },
    removeItem(key) {
      storage.delete(key);
    }
  };
  const context = {
    localStorage,
    window: {
      ChatModel: {
        clearMessages() {}
      }
    }
  };
  vm.createContext(context);
  const modelPath = path.join(__dirname, '..', 'frontend', 'js', 'models', 'documentModel.js');
  const modelSource = fs.readFileSync(modelPath, 'utf8');
  vm.runInContext(`${modelSource}\nthis.DocumentModel = DocumentModel;`, context);
  return context.DocumentModel;
}

test('crear categorías evita duplicados sin importar mayúsculas', () => {
  const model = createDocumentModel();

  assert.equal(model.addCategory('Cálculo'), true);
  assert.equal(model.addCategory('calculo'), false);
  assert.deepEqual(Array.from(model.getCategories()), ['General', 'Cálculo']);
});

test('crear, mover y eliminar documentos conserva su materia', () => {
  const model = createDocumentModel();
  model.addCategory('Historia');

  model.saveDocument('doc-1', 'Lectura.pdf', 'Historia');
  assert.equal(model.getDocuments()[0].category, 'Historia');
  assert.equal(model.setDocumentCategory('doc-1', 'General'), true);
  assert.equal(model.getDocuments()[0].category, 'General');
});

test('eliminar una materia mueve sus documentos a General', () => {
  const model = createDocumentModel();
  model.addCategory('Programación');
  model.saveDocument('doc-1', 'Algoritmos.pdf', 'Programación');

  model.deleteCategory('Programación');

  assert.deepEqual(Array.from(model.getCategories()), ['General']);
  assert.equal(model.getDocuments()[0].category, 'General');
});
