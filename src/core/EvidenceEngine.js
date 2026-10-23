/**
 * ============================================================================
 * EVIDENCE ENGINE (生活科學物證鑑識引擎)
 * ============================================================================
 * 嚴格依照企劃書 01A、04 節「108 課綱跨領域自然科學與生活鑑識」實裝：
 * 1. 物質酸鹼性質（廣用試紙、pH 比色色帶分析）
 * 2. 熱學與氣態變化（熱對流、檸檬酸弱有機酸受熱脫水炭化 75~85°C 顯影）
 * 3. 光學與透鏡成像（365nm UV 螢光激發、多倍率光學微痕、日影相似三角形幾何）
 * 4. 沉浮與密度測量（阿基米德浮力定律、量筒排水法、密度計算 D = M / V）
 * 5. 聲學與傳播速率（常溫聲速 340m/s、長廊回音時差演算）
 * 6. 力學與運動定律（牛頓第一運動定律慣性力矩、轉彎向心加速度向量、壓強公式 P = F / A）
 * 7. 凝結與光學散射（低溫玻璃遇熱水汽露點凝結顯影油脂指紋）
 */

class EvidenceEngine {
  constructor(storyLoader) {
    this.loader = storyLoader;
    this.examinedHistory = new Map();
  }

  /**
   * 調查員使用指定鑑識器材化驗物證 (標準調用主入口)
   */
  examineEvidence(evidenceId, toolId, investigator) {
    const caseList = this.loader.listCases();
    let targetEvidenceDef = null;
    let parentCase = null;

    for (const c of caseList) {
      const found = (c.evidenceChain || []).find(e => e.id === evidenceId);
      if (found) {
        targetEvidenceDef = found;
        parentCase = c;
        break;
      }
    }

    if (!targetEvidenceDef) {
      return { success: false, error: `未在任何案件中找到物證 [${evidenceId}] 的鑑識規格。` };
    }

    // 檢查調查員背包是否攜帶此工具
    if (investigator) {
      const hasTool = investigator.inventory.hasTool(toolId);
      if (!hasTool) {
        return {
          success: false,
          error: `調查員尚未攜帶指定鑑識器材 [${toolId}]！請至超商購買或赴科教館借用。`
        };
      }
    }

    const checkSpec = targetEvidenceDef.scienceCheck;
    if (!checkSpec) {
      return { success: false, error: '該物證未配置科學化驗參數。' };
    }

    // 器材不符時，提供科學提示引導
    if (checkSpec.tool !== toolId) {
      const hints = {
        tool_ph_paper: '此物證需檢測酸鹼水溶液性質，請使用廣用 pH 試紙組！',
        tool_uv_torch: '此物證含有微量螢光防偽劑或生物鹼，需使用 365nm 紫外燈激發！',
        tool_magnifier: '此物證細微處有刮痕或纖維斷裂，請使用光學放大鏡進行微痕觀察！',
        tool_thermal_oven: '此物證需受熱脫水顯影，請使用溫泉蒸氣顯影烘箱！',
        tool_water_cylinder: '此物證需測定體積與密度，請使用精密排水量筒！',
        tool_inertia_gauge: '此物證需分析緊急煞車之受力向量，請使用慣性力矩向量儀！',
        tool_accel_sensor: '此物證涉及公車轉彎向心加速度，請使用向心力加速度感測計！',
        tool_metal_detector: '此物證內部可能暗藏金屬貴重物，請使用便攜金屬探測器！',
        tool_pressure_plate: '此物證涉及草坪受力面積，請使用壓強測定計算板！',
        tool_vapor_spray: '此物證需藉由熱水微霧凝結顯影，請使用微霧水蒸氣罐！'
      };
      return {
        success: false,
        isMismatch: true,
        message: `鑑識器材不符：使用 ${toolId} 無法對【${targetEvidenceDef.name}】產生明確化驗反應。${hints[checkSpec.tool] || '請更換對應的科普鑑識工具！'}`
      };
    }

    // 化驗成功，解鎖關鍵破案線索
    const record = {
      evidenceId,
      evidenceName: targetEvidenceDef.name,
      caseId: parentCase.id,
      toolId,
      method: checkSpec.method || 'standard_science_check',
      result: checkSpec.expectedResult,
      clueUnlocked: checkSpec.clueUnlocked,
      examinedAt: new Date().toISOString()
    };
    this.examinedHistory.set(evidenceId, record);

    if (investigator) {
      investigator.inventory.updateEvidenceStatus(evidenceId, checkSpec.expectedResult);
      investigator.addNotebookNote(
        `【鑑識報告】${targetEvidenceDef.name}`,
        `器材：${toolId}\n化驗數據：${checkSpec.expectedResult}\n科學推論：${checkSpec.clueUnlocked}`,
        ['物證化驗', '自然科學', parentCase.title]
      );
    }

    return {
      success: true,
      caseId: parentCase.id,
      evidenceId,
      evidenceName: targetEvidenceDef.name,
      result: checkSpec.expectedResult,
      clueUnlocked: checkSpec.clueUnlocked
    };
  }

  isEvidenceExamined(evidenceId) {
    return this.examinedHistory.has(evidenceId);
  }

  getExaminedRecord(evidenceId) {
    return this.examinedHistory.get(evidenceId) || null;
  }

  // ─── 專題自然科學實驗演算模組 (108 課綱自然科學深入對齊) ───

  /**
   * 1. 廣用 pH 酸鹼滴定實驗
   */
  runPhTitration(pHValue) {
    let color = '綠色 (中性)';
    let nature = '中性';
    if (pHValue < 3) { color = '深紅色 (強酸)'; nature = '強酸性'; }
    else if (pHValue < 6.5) { color = '橙黃色 (弱酸)'; nature = '弱酸性'; }
    else if (pHValue <= 7.5) { color = '鮮綠色 (中性)'; nature = '中性'; }
    else if (pHValue <= 10) { color = '藍綠色 (弱鹼)'; nature = '弱鹼性'; }
    else { color = '深紫藍色 (強鹼)'; nature = '強鹼性'; }

    return {
      pH: Number(pHValue.toFixed(1)),
      colorBand: color,
      chemicalNature: nature,
      scientificPrinciple: '氫離子濃度指數 pH = -log[H+]，廣用指示劑隨氫離子濃度改變分子結構並顯現不同吸收光譜。'
    };
  }

  /**
   * 2. 阿基米德浮力與密度測定 D = M / V
   */
  runArchimedesDensity(massGrams, volumeMl) {
    if (volumeMl <= 0) return { error: '排水體積必須大於 0' };
    const density = Number((massGrams / volumeMl).toFixed(2));

    // 比對純金屬標準密度表
    const metalStandards = {
      '純金': 19.3,
      '純銀': 10.5,
      '純銅': 8.9,
      '黃銅': 8.5,
      '鐵': 7.9,
      '鋅合金': 6.7
    };

    let matchedMetal = '未知或中空複合材料';
    let isHollowSuspected = false;

    if (Math.abs(density - 8.9) <= 0.3) {
      matchedMetal = '純銅 (8.9 g/cm³)';
    } else if (density < 7.5 && massGrams >= 45) {
      matchedMetal = '密度異常偏低 (中空掏空或輕合金摻假)';
      isHollowSuspected = true;
    }

    return {
      massGrams,
      displacedVolumeMl: volumeMl,
      calculatedDensity: `${density} g/cm³`,
      matchedMetal,
      isHollowSuspected,
      formula: 'D = M / V (密度 = 質量 ÷ 體積)',
      scientificPrinciple: '阿基米德浮力定律：浸入液體之固體所受浮力等於其排開同體積液體之重量，利用排水量精準測定固體真實體積。'
    };
  }

  /**
   * 3. 物理壓強計算 P = F / A
   */
  runPressureCalculation(massKg, areaCm2) {
    if (areaCm2 <= 0) return { error: '受力面積必須大於 0' };
    const forceN = massKg * 9.8; // 重力 F = m * g
    const areaM2 = areaCm2 / 10000;
    const pressurePa = forceN / areaM2;
    const pressureKPa = Number((pressurePa / 1000).toFixed(2));

    const soilYieldLimitKPa = 6.0; // 飽和爛泥剪切屈服極限約 6 kPa
    const willMudSink = pressureKPa >= soilYieldLimitKPa;

    return {
      massKg,
      contactAreaCm2: areaCm2,
      forceNewtons: Number(forceN.toFixed(1)),
      pressureKPa,
      soilLimitKPa: soilYieldLimitKPa,
      willMudSink,
      phenomenon: willMudSink
        ? `壓強 ${pressureKPa} kPa ≥ 剪切極限 ${soilYieldLimitKPa} kPa，草地必下陷踩出明顯鞋印！`
        : `壓強 ${pressureKPa} kPa < 剪切極限 ${soilYieldLimitKPa} kPa，草葉只受彈性彎折而不陷入泥中，形成無腳印現象！`,
      formula: 'P = F / A (壓強 = 作用力 ÷ 受力面積)'
    };
  }

  /**
   * 4. 牛頓第一運動定律與煞車慣性向量
   */
  runInertiaVectorAnalysis(vehicleDirectionDeg, decelerationMs2, personPosture) {
    // 當車輛沿 vehicleDirectionDeg 減速煞車時，加速度向量相反，慣性力向量則同向於前進方向
    const inertiaForceDirectionDeg = (vehicleDirectionDeg) % 360;
    return {
      vehicleHeading: `${vehicleDirectionDeg}°`,
      deceleration: `${decelerationMs2} m/s²`,
      inertiaVectorHeading: `${inertiaForceDirectionDeg}° (沿行進方向向前撲倒)`,
      personPostureObserved: personPosture,
      isNaturalReaction: personPosture.includes('前傾') || personPosture.includes('向前撲倒'),
      scientificPrinciple: '牛頓第一運動定律：物體在無外力作用下維持原有運動狀態；車輛緊急制軔時，車廂減速，人體因慣性繼續向前運動，受力方向必朝前。'
    };
  }

  /**
   * 5. 常溫聲速時差計算
   */
  runAcousticDelayCalculation(distanceMeters, temperatureC = 20) {
    const soundSpeed = 331.5 + 0.6 * temperatureC; // 聲速公式 v = 331.5 + 0.6*T
    const travelTimeSeconds = Number((distanceMeters / soundSpeed).toFixed(3));

    return {
      distanceMeters,
      temperatureC,
      soundSpeedMs: Number(soundSpeed.toFixed(1)),
      travelTimeSeconds,
      scientificPrinciple: `在 ${temperatureC}°C 常溫空氣中，聲波傳播 ${distanceMeters} 公尺僅需 ${travelTimeSeconds} 秒，絕不可能延遲數十分鐘！`
    };
  }

  /**
   * 6. 薄層色層分析 (TLC) 展開比 Rf 演算
   * 公式：Rf = 溶質移動距離 (mm) / 展開劑前沿移動距離 (mm)
   */
  runTlcRfAnalysis(spotDistanceMm, solventFrontMm, standardRf = 0.42, tolerance = 0.05) {
    if (solventFrontMm <= 0) return { error: '溶劑前沿移動距離必須大於 0' };
    if (spotDistanceMm < 0 || spotDistanceMm > solventFrontMm) {
      return { error: '溶質爬升距離不能小於 0 且不能超越溶劑前沿' };
    }

    const calculatedRf = Number((spotDistanceMm / solventFrontMm).toFixed(2));
    const isMatched = Math.abs(calculatedRf - standardRf) <= tolerance;

    return {
      spotDistanceMm,
      solventFrontMm,
      calculatedRf,
      standardRf,
      tolerance,
      isMatched,
      conclusion: isMatched
        ? `薄層層析展開比 Rf = ${calculatedRf} 與標準品 Rf = ${standardRf} (容差 ±${tolerance}) 完全吻合，證實成分高度一致！`
        : `薄層層析展開比 Rf = ${calculatedRf} 與標準品 Rf = ${standardRf} 顯著偏差，排除同種化學物質。`,
      formula: 'Rf = 溶質移動距離 ÷ 展開劑前沿移動距離',
      scientificPrinciple: '108 課綱基礎化學毛細現象與分配層析原理：混合物在固定相（矽膠薄層）與移動相（展開溶劑）間因極性與溶解度差異產生不同的遷移速率。'
    };
  }

  /**
   * 7. 紫外光 (UV) 螢光光譜激發判定
   * 判定激發波長（例如 365nm UV-A、254nm UV-C）下的特定受檢物質光學反應
   */
  runUvFluorescenceAnalysis(wavelengthNm, substanceKey) {
    const uvStandards = {
      amygdalin: {
        name: '苦杏仁苷 (有機生物鹼)',
        excitationNm: 365,
        fluorescenceColor: '亮黃綠色',
        visibleUnderNormalLight: false,
        desc: '在 365nm 紫外燈激發下顯露特征黃綠色螢光色帶。'
      },
      sweat_protein: {
        name: '汗液蛋白質與油脂殘留 (指紋)',
        excitationNm: 365,
        fluorescenceColor: '微弱青白色',
        visibleUnderNormalLight: false,
        desc: '汗液所含色胺酸與皮脂在 365nm 紫外光下激發微弱青白螢光，凸顯指紋脊線與印痕。'
      },
      currency_ink: {
        name: '鈔券防偽螢光油墨',
        excitationNm: 365,
        fluorescenceColor: '鮮橙紅色',
        visibleUnderNormalLight: false,
        desc: '央行特種螢光防偽纖維與油墨激發。'
      }
    };

    const targetSubstance = uvStandards[substanceKey] || {
      name: substanceKey || '未知化合物',
      excitationNm: 365,
      fluorescenceColor: '無明顯螢光激發',
      visibleUnderNormalLight: true,
      desc: '未檢測出顯著特徵螢光反應。'
    };

    const isExcited = Math.abs(wavelengthNm - targetSubstance.excitationNm) <= 20;

    return {
      testedWavelengthNm: wavelengthNm,
      substanceKey,
      substanceName: targetSubstance.name,
      isExcited,
      observedFluorescence: isExcited ? targetSubstance.fluorescenceColor : '無螢光（非該物質最佳激發波長）',
      details: targetSubstance.desc,
      scientificPrinciple: '光學史托克定律 (Stokes Law)：分子吸收高能量短波長紫外光（如 365nm）躍遷至激發態，退激發時釋放較低能量長波長的可見光螢光。'
    };
  }
}

module.exports = {
  EvidenceEngine
};
