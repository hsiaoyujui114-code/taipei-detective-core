/**
 * ============================================================================
 * STORY LOADER (動態非寫死劇情資料載入器)
 * ============================================================================
 * 落實委託人指示：「劇情部分可以先做，但之後我可能還會改，所以劇情的程式碼先不要寫死」。
 * 本模組負責從 JSON 配置檔動態載入案件、人物、證物與對話樹，支援熱重載與動態注入。
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
    const file = path.join(this.baseDir, 'cases/demo_cases.json');
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      this.cases.clear();
      data.forEach(c => this.cases.set(c.id, c));
    }
  }

  loadNpcs() {
    const file = path.join(this.baseDir, 'npcs/suspects.json');
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      this.npcs.clear();
      data.forEach(n => this.npcs.set(n.id, n));
    }
  }

  loadDialogues() {
    const file = path.join(this.baseDir, 'dialogues/sample_dialogues.json');
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      this.dialogues.clear();
      Object.keys(data).forEach(k => this.dialogues.set(k, data[k]));
    }
  }

  loadItems() {
    const file = path.join(this.baseDir, 'items/evidence_items.json');
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      this.items.clear();
      data.forEach(i => this.items.set(i.id, i));
    }
  }

  getCase(caseId) { return this.cases.get(caseId) || null; }
  listCases() { return Array.from(this.cases.values()); }
  getNpc(npcId) { return this.npcs.get(npcId) || null; }
  listNpcs() { return Array.from(this.npcs.values()); }
  getDialogueTree(npcId) { return this.dialogues.get(npcId) || null; }
  getItem(itemId) { return this.items.get(itemId) || null; }

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
