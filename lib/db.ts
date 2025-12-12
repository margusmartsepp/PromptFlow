import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Prompt, PromptVersion } from '../types';

interface PromptDB extends DBSchema {
  prompts: {
    key: string;
    value: Prompt;
    indexes: { 'by-updated': number };
  };
  versions: {
    key: string;
    value: PromptVersion;
    indexes: { 'by-prompt': string };
  };
}

const DB_NAME = 'prompt-flow-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<PromptDB>>;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<PromptDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const promptStore = db.createObjectStore('prompts', { keyPath: 'id' });
        promptStore.createIndex('by-updated', 'updatedAt');
        
        const versionStore = db.createObjectStore('versions', { keyPath: 'id' });
        versionStore.createIndex('by-prompt', 'promptId');
      },
    });
  }
  return dbPromise;
};

export const createPrompt = async (content: string = ''): Promise<Prompt> => {
  const db = await getDB();
  const id = crypto.randomUUID();
  const now = Date.now();
  const prompt: Prompt = {
    id,
    title: 'Untitled Prompt',
    content,
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
  await db.put('prompts', prompt);
  return prompt;
};

export const updatePrompt = async (id: string, updates: Partial<Prompt>): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction('prompts', 'readwrite');
  const store = tx.objectStore('prompts');
  const existing = await store.get(id);
  
  if (existing) {
    // Generate title from content if not explicitly set in updates
    let title = updates.title || existing.title;
    if (updates.content && !updates.title && existing.title === 'Untitled Prompt') {
      title = updates.content.slice(0, 40).replace(/\n/g, ' ') || 'Untitled Prompt';
    }

    await store.put({
      ...existing,
      ...updates,
      title,
      updatedAt: Date.now(),
    });
  }
  await tx.done;
};

export const getPrompt = async (id: string): Promise<Prompt | undefined> => {
  const db = await getDB();
  return db.get('prompts', id);
};

export const deletePrompt = async (id: string): Promise<void> => {
  const db = await getDB();
  await db.delete('prompts', id);
};

export const listPrompts = async (): Promise<Prompt[]> => {
  const db = await getDB();
  return db.getAllFromIndex('prompts', 'by-updated');
};

export const saveVersion = async (promptId: string, content: string, description: string): Promise<void> => {
  const db = await getDB();
  const version: PromptVersion = {
    id: crypto.randomUUID(),
    promptId,
    content,
    createdAt: Date.now(),
    changeDescription: description,
  };
  await db.put('versions', version);
};

export const getVersions = async (promptId: string): Promise<PromptVersion[]> => {
  const db = await getDB();
  const versions = await db.getAllFromIndex('versions', 'by-prompt', promptId);
  // Sort descending by creation time
  return versions.sort((a, b) => b.createdAt - a.createdAt);
};

export const importPrompts = async (prompts: Prompt[]): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction('prompts', 'readwrite');
  const store = tx.objectStore('prompts');
  
  for (const prompt of prompts) {
    // Ensure we don't overwrite newer versions if ID collides (though UUIDs make this rare)
    // For simplicity in this import, we just put them in. 
    // real world logic might check timestamps.
    await store.put(prompt);
  }
  await tx.done;
};

export const clearAllData = async (): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction(['prompts', 'versions'], 'readwrite');
  await tx.objectStore('prompts').clear();
  await tx.objectStore('versions').clear();
  await tx.done;
};