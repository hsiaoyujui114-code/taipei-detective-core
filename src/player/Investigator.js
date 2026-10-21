/**
 * ============================================================================
 * INVESTIGATOR (都會調查員狀態模型)
 * ============================================================================
 * 嚴守三大憲法級規範：
 * 1. 稱謂一律為「都會調查員」(Investigator) 或「市民」。
 * 2. 名字自訂或預設「都會調查員」。
 * 3. 嚴守真實大眾運輸與物理步行移動，杜絕任何瞬移行為。
 */

const { Inventory } = require('./Inventory');
const { EcoWallet } = require('./EcoWallet');

class Investigator {
  constructor(name = '雙北行蹤調查員') {
    this.name = name;
    this.roleTitle = '都會調查員';
    this.level = 1;
    this.experience = 0;
    this.maxStamina = 100;
    this.stamina = 100;

    this.inventory = new Inventory();
    this.wallet = new EcoWallet(350, true);

    this.activeCaseId = null;
    this.solvedCases = [];
    this.notebook = []; // 調查筆記本 (客觀筆錄與矛盾點)
  }

  addNotebookNote(title, content, tags = []) {
    const note = {
      id: 'note_' + Date.now(),
      timestamp: new Date().toISOString(),
      title,
      content,
      tags
    };
    this.notebook.push(note);
    return note;
  }

  consumeStamina(amount) {
    if (this.stamina < amount) return false;
    this.stamina -= amount;
    return true;
  }

  recoverStamina(amount) {
    this.stamina = Math.min(this.maxStamina, this.stamina + amount);
  }

  getStatus() {
    return {
      name: this.name,
      roleTitle: this.roleTitle,
      level: this.level,
      stamina: `${this.stamina}/${this.maxStamina}`,
      easyCard: `$${this.wallet.easyCardBalance}`,
      ecoPoints: this.wallet.ecoPoints,
      tpassActive: this.wallet.hasTpass1200,
      activeCase: this.activeCaseId,
      solvedCount: this.solvedCases.length,
      itemCount: this.inventory.listAll().totalCount
    };
  }
}

module.exports = {
  Investigator
};
