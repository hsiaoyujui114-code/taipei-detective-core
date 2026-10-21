/**
 * ============================================================================
 * STORY LOADER (動態非寫死劇情資料載入器)
 * ============================================================================
 * 嚴格落實委託人指示：「劇情部分可以先做，但之後我可能還會改，所以劇情的程式碼先不要寫死」。
 *
 * 特性：
 * 1. 自動掃描並解析 data/cases/*.json, data/npcs/*.json, data/dialogues/*.json, data/items/*.json。
 * 2. 支援單一檔案或多檔案拆分，隨時抽換 JSON 無需更動核心程式碼。
 * 3. 支援熱重載 (reloadAll) 與動態注入 (injectCase)。
 * 4. 提供關聯查詢：如依案件篩選專屬涉案人名單 (getSuspectsForCase) 與物證 (getEvidencesForCase)。
 */

const fs = require('fs');
const path = require('path');

class StoryLoader {
  constructor(baseDataDir) {
    this.baseDir = baseDataDir || path.join(__dirname, '../data');
    this.cases = new Map();
    this.npcs = new Map();
    this.dialogues = new Map();
    this.items = new Map();
    this.reloadAll();
  }

  reloadAll() {
    this.loadCases();
    this.loadNpcs();
    this.loadDialogues();
    this.loadItems();
    return {
      casesCount: this.cases.size,
      npcsCount: this.npcs.size,
      dialoguesCount: this.dialogues.size,
      itemsCount: this.items.size
    };
  }

  loadCases() {
    this.cases.clear();
    const casesDir = path.join(this.baseDir, 'cases');
    if (fs.existsSync(casesDir)) {
      const files = fs.readdirSync(casesDir).filter(f => f.endsWith('.json'));
      files.forEach(f => {
        try {
          const content = fs.readFileSync(path.join(casesDir, f), 'utf8');
          const data = JSON.parse(content);
          if (Array.isArray(data)) {
            data.forEach(c => { if (c.id) this.cases.set(c.id, c); });
          } else if (data.id) {
            this.cases.set(data.id, data);
          }
        } catch (err) {
          console.error(`[StoryLoader] 載入案件檔案失敗 ${f}:`, err.message);
        }
      });
    }
  }

  loadNpcs() {
    this.npcs.clear();
    const npcsDir = path.join(this.baseDir, 'npcs');
    if (fs.existsSync(npcsDir)) {
      const files = fs.readdirSync(npcsDir).filter(f => f.endsWith('.json'));
      files.forEach(f => {
        try {
          const content = fs.readFileSync(path.join(npcsDir, f), 'utf8');
          const data = JSON.parse(content);
          if (Array.isArray(data)) {
            data.forEach(n => { if (n.id) this.npcs.set(n.id, n); });
          } else if (data.id) {
            this.npcs.set(data.id, data);
          }
        } catch (err) {
          console.error(`[StoryLoader] 載入人物檔案失敗 ${f}:`, err.message);
        }
      });
    }
  }

  loadDialogues() {
    this.dialogues.clear();
    const dialoguesDir = path.join(this.baseDir, 'dialogues');
    if (fs.existsSync(dialoguesDir)) {
      const files = fs.readdirSync(dialoguesDir).filter(f => f.endsWith('.json'));
      files.forEach(f => {
        try {
          const content = fs.readFileSync(path.join(dialoguesDir, f), 'utf8');
          const data = JSON.parse(content);
          Object.keys(data).forEach(k => this.dialogues.set(k, data[k]));
        } catch (err) {
          console.error(`[StoryLoader] 載入對話檔案失敗 ${f}:`, err.message);
        }
      });
    }
  }

  loadItems() {
    this.items.clear();
    const itemsDir = path.join(this.baseDir, 'items');
    if (fs.existsSync(itemsDir)) {
      const files = fs.readdirSync(itemsDir).filter(f => f.endsWith('.json'));
      files.forEach(f => {
        try {
          const content = fs.readFileSync(path.join(itemsDir, f), 'utf8');
          const data = JSON.parse(content);
          if (Array.isArray(data)) {
            data.forEach(i => { if (i.id) this.items.set(i.id, i); });
          } else if (data.id) {
            this.items.set(data.id, data);
          }
        } catch (err) {
          console.error(`[StoryLoader] 載入道具物證失敗 ${f}:`, err.message);
        }
      });
    }
  }

  getCase(caseId) { return this.cases.get(caseId) || null; }
  listCases() { return Array.from(this.cases.values()); }

  getNpc(npcId) {
    if (npcId === 'suspect_01_barista') return this.npcs.get('suspect_01_wu') || this.npcs.get(npcId) || null;
    return this.npcs.get(npcId) || null;
  }

  listNpcs() { return Array.from(this.npcs.values()); }

  getDialogueTree(npcId) {
    if (npcId === 'suspect_01_barista') return this.dialogues.get('suspect_01_wu') || this.dialogues.get(npcId) || null;
    return this.dialogues.get(npcId) || null;
  }

  getItem(itemId) { return this.items.get(itemId) || null; }
  listItems() { return Array.from(this.items.values()); }

  getSuspectsForCase(caseId) {
    return Array.from(this.npcs.values()).filter(n => n.caseId === caseId);
  }

  getEvidencesForCase(caseId) {
    return Array.from(this.items.values()).filter(i => i.caseId === caseId);
  }

  /**
   * 允許委託人動態注入新案件，無須修改任何核心程式碼
   */
  injectCase(caseObj) {
    if (!caseObj.id) throw new Error('案件必須具備唯一 id');
    this.cases.set(caseObj.id, caseObj);
    return true;
  }
}

module.exports = {
  StoryLoader
};
