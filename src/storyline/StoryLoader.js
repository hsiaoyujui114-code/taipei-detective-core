/**
 * ============================================================================
 * STORY LOADER (動態非寫死劇情資料載入器)
 * ============================================================================
 * 嚴格落實委託人指示：「劇情部分可以先做，但之後我可能還會改，所以劇情的程式碼先不要寫死」。
 *
 * 特性：
 * 1. 自動掃描並解析 data/cases/*.json, data/npcs/*.json, data/dialogues/*.json, data/items/*.json。
 * 2. 深度整合《雙北漫遊：都會行蹤》50 宗歷史風情與生活科學案件全集 (fifty_cases.json)。
 * 3. 雙向豐富化 (enrichDemoCasesWithStory)：將 50 案全集的在地歷史、生活科學原理、交通冷知識、
 *    三段式故事進程（起因、經過、高潮破案）、筆錄矛盾與三軌道具彩蛋無縫注入首發示範案。
 * 4. 支援熱重載 (reloadAll) 與動態注入 (injectCase)。
 * 5. 提供關聯查詢：如依案件篩選專屬涉案人名單 (getSuspectsForCase) 與物證 (getEvidencesForCase)。
 */

const fs = require('fs');
const path = require('path');

class StoryLoader {
  /**
   * @param {string|null} baseDataDir - 資料檔案根目錄 (預設為 src/data)
   */
  constructor(baseDataDir) {
    this.baseDir = baseDataDir || path.join(__dirname, '../data');
    this.cases = new Map();       // 首發示範案 (demo_cases.json)
    this.fiftyCases = new Map();  // 50 宗歷史風情與生活科學案件全集 (fifty_cases.json)
    this.npcs = new Map();
    this.dialogues = new Map();
    this.items = new Map();
    this.reloadAll();
  }

  /**
   * 重新載入所有動態資料庫
   * @returns {{ casesCount: number, fiftyCasesCount: number, npcsCount: number, dialoguesCount: number, itemsCount: number }}
   */
  reloadAll() {
    this.loadCases();
    this.loadNpcs();
    this.loadDialogues();
    this.loadItems();
    return {
      casesCount: this.cases.size,
      fiftyCasesCount: this.listFiftyCases().length,
      npcsCount: this.npcs.size,
      dialoguesCount: this.dialogues.size,
      itemsCount: this.items.size
    };
  }

  /**
   * 載入案件檔案庫 (自動區分首發示範案與 50 案全集)
   */
  loadCases() {
    this.cases.clear();
    this.fiftyCases.clear();
    const casesDir = path.join(this.baseDir, 'cases');

    if (fs.existsSync(casesDir)) {
      const files = fs.readdirSync(casesDir).filter(f => f.endsWith('.json'));
      files.forEach(f => {
        try {
          const content = fs.readFileSync(path.join(casesDir, f), 'utf8');
          const data = JSON.parse(content);

          if (f.includes('fifty') || f.includes('archive') || f === 'fifty_cases.json') {
            // 50 宗全集資料庫
            if (Array.isArray(data)) {
              data.forEach(c => {
                if (c.id) {
                  this.fiftyCases.set(c.id, c);
                  // 同時建立純數字與小寫別名索引方便快速查詢
                  const numMatch = c.id.match(/\d+/);
                  if (numMatch) {
                    const padNum = numMatch[0].padStart(2, '0');
                    this.fiftyCases.set(`case_${padNum}`, c);
                    this.fiftyCases.set(`CASE-${padNum}`, c);
                  }
                }
              });
            }
          } else {
            // 核心示範案 (如 demo_cases.json)
            if (Array.isArray(data)) {
              data.forEach(c => { if (c.id) this.cases.set(c.id, c); });
            } else if (data.id) {
              this.cases.set(data.id, data);
            }
          }
        } catch (err) {
          console.error(`[StoryLoader] 載入案件檔案失敗 ${f}:`, err.message);
        }
      });
    }

    // 雙向豐富化首發示範案
    this.enrichDemoCasesWithStory();
  }

  /**
   * 將 50 案全集的劇情與科學筆錄深度注入至首發示範案
   */
  enrichDemoCasesWithStory() {
    for (const [id, c] of this.cases.entries()) {
      // 依標題或 ID 比對 50 案全集
      let matchedFifty = null;
      for (const fc of this.fiftyCases.values()) {
        if (fc.id === id || fc.title === c.title || (c.caseNumber && fc.id === c.caseNumber.replace('CASE-2026-', 'CASE-'))) {
          matchedFifty = fc;
          break;
        }
      }

      if (matchedFifty) {
        c.history_culture = matchedFifty.history_culture || c.history_culture;
        c.science_principle = matchedFifty.science_principle || c.science_principle;
        c.traffic_trivia = matchedFifty.traffic_trivia || c.traffic_trivia;
        c.story_cause = matchedFifty.story_cause || c.story_cause;
        c.story_process = matchedFifty.story_process || c.story_process;
        c.story_climax = matchedFifty.story_climax || c.story_climax;
        c.deposition = matchedFifty.deposition || c.deposition;
        c.props_and_easter_egg = matchedFifty.props_and_easter_egg || c.props_and_easter_egg;
        c.storyCharacters = matchedFifty.characters || [];
      }
    }
  }

  /**
   * 載入涉案關係人名冊
   */
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

  /**
   * 載入對話樹
   */
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

  /**
   * 載入道具與物證庫
   */
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

  /**
   * 取得指定案件 (支援 demo 示範案與 50 案全集相互查詢)
   * @param {string} caseId
   * @returns {Object|null}
   */
  getCase(caseId) {
    if (!caseId) return null;
    if (this.cases.has(caseId)) return this.cases.get(caseId);
    if (this.fiftyCases.has(caseId)) return this.fiftyCases.get(caseId);

    // 格式容錯轉換：如 case_01 ⇄ CASE-01
    const altId = caseId.startsWith('case_')
      ? caseId.replace('case_', 'CASE-')
      : caseId.replace('CASE-', 'case_');

    if (this.cases.has(altId)) return this.cases.get(altId);
    if (this.fiftyCases.has(altId)) return this.fiftyCases.get(altId);

    return null;
  }

  /**
   * 列出所有首發示範案 (共 10 宗，具備完整引擎可遊玩性)
   * @returns {Array<Object>}
   */
  listCases() {
    return Array.from(this.cases.values());
  }

  /**
   * 列出 50 宗歷史風情與生活科學案件全集
   * @returns {Array<Object>}
   */
  listFiftyCases() {
    const seen = new Set();
    const list = [];
    for (const c of this.fiftyCases.values()) {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        list.push(c);
      }
    }
    return list;
  }

  /**
   * 依序號或 ID 取得 50 案中的單一案件
   * @param {string|number} idOrNum
   * @returns {Object|null}
   */
  getFiftyCase(idOrNum) {
    const key = typeof idOrNum === 'number'
      ? `CASE-${String(idOrNum).padStart(2, '0')}`
      : String(idOrNum);
    return this.fiftyCases.get(key) || this.getCase(key);
  }

  getNpc(npcId) {
    if (npcId === 'suspect_01_barista') return this.npcs.get('suspect_01_wu') || this.npcs.get(npcId) || null;
    return this.npcs.get(npcId) || null;
  }

  listNpcs() {
    return Array.from(this.npcs.values());
  }

  getDialogueTree(npcId) {
    if (npcId === 'suspect_01_barista') return this.dialogues.get('suspect_01_wu') || this.dialogues.get(npcId) || null;
    return this.dialogues.get(npcId) || null;
  }

  getItem(itemId) {
    return this.items.get(itemId) || null;
  }

  listItems() {
    return Array.from(this.items.values());
  }

  /**
   * 取得指定案件專屬涉案人 (若為 50 案則動態由 characters 構建)
   * @param {string} caseId
   * @returns {Array<Object>}
   */
  getSuspectsForCase(caseId) {
    const directNpcs = Array.from(this.npcs.values()).filter(n => n.caseId === caseId);
    if (directNpcs.length > 0) return directNpcs;

    // 檢查 50 案全集
    const c = this.getCase(caseId);
    if (c && Array.isArray(c.characters)) {
      return c.characters.map((char, idx) => ({
        id: `npc_${c.id || 'case'}_${idx + 1}`,
        name: char.name,
        identity: char.identity,
        caseId: c.id,
        motive: char.motive,
        statement: char.statement,
        flaw: char.flaw,
        job_daily: char.job_daily,
        relation_others: char.relation_others,
        relation_victim: char.relation_victim
      }));
    }

    return [];
  }

  /**
   * 取得指定案件專屬物證 (若為 50 案則動態構建物證)
   * @param {string} caseId
   * @returns {Array<Object>}
   */
  getEvidencesForCase(caseId) {
    const directItems = Array.from(this.items.values()).filter(i => i.caseId === caseId);
    if (directItems.length > 0) return directItems;

    const c = this.getCase(caseId);
    if (c) {
      const items = [];
      if (c.deposition && c.deposition.critical_evidence) {
        items.push({
          id: `evi_${c.id}_critical`,
          caseId: c.id,
          name: '核心定罪物證',
          type: 'evidence',
          desc: c.deposition.critical_evidence,
          examined: true
        });
      }
      if (c.props_and_easter_egg) {
        if (c.props_and_easter_egg.prop_money) {
          items.push({
            id: `item_${c.id}_money`,
            caseId: c.id,
            name: '門市探索耗材',
            type: 'supply',
            desc: c.props_and_easter_egg.prop_money
          });
        }
        if (c.props_and_easter_egg.easter_egg) {
          items.push({
            id: `egg_${c.id}`,
            caseId: c.id,
            name: '生活圈隱藏彩蛋',
            type: 'easter_egg',
            desc: c.props_and_easter_egg.easter_egg
          });
        }
      }
      return items;
    }

    return [];
  }

  /**
   * 允許委託人動態注入新案件，無須修改任何核心程式碼
   * @param {Object} caseObj
   * @returns {boolean}
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
