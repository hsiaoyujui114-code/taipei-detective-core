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
 * 8. 植物氰苷酵素解水解催化與雙重致病途徑（苦杏仁苷為天然雙糖植物氰苷，受 65°C 熱咖啡蒸氣與 Emulsin 活化催化水解）
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
        tool_uv_torch: '此物證含有微量螢光防偽劑或植物氰苷，需使用 365nm 紫外燈激發！',
        tool_magnifier: '此物證細微處有刮痕或纖維斷裂，請使用光學放大鏡進行微痕觀察！',
        tool_thermal_oven: '此物證需 140℃ 乾熱脫水低溫炭化顯影（排除潮濕水蒸氣），請使用鑑識專用乾熱熨斗組！',
        tool_water_cylinder: '此物證需測定體積與密度，請使用廣口高精度 500ml 鑑識玻璃量筒！',
        tool_cipher_table: '此物證為 1860 年代英國皇家海軍海事旗語代碼，請使用旗語字母頻率對照表破譯 ANCHOR！',
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
   * 3. 物理壓強計算 P = F / A 與動態天候土壤剪切極限連鎖
   * @param {number} massKg - 質量 (kg)
   * @param {number} areaCm2 - 受力面積 (cm²)
   * @param {Object} environment - 環境情境參數 { weather, temperatureC, humidityPercent, soilCondition }
   */
  runPressureCalculation(massKg, areaCm2, environment = {}) {
    if (areaCm2 <= 0) return { error: '受力面積必須大於 0' };
    const forceN = massKg * 9.8; // 重力 F = m * g
    const areaM2 = areaCm2 / 10000;
    const pressurePa = forceN / areaM2;
    const pressureKPa = Number((pressurePa / 1000).toFixed(2));

    // 動態天候與微環境情境連鎖：
    // 晴天土壤剪切屈服極限約 6.0 kPa；
    // 連日降雨或飽和泥地，土壤抗剪強度急遽下修至 3.5 kPa！
    const isRainyOrSaturated =
      environment.weather === 'rainy' ||
      environment.weather === 'storm' ||
      environment.soilCondition === 'saturated' ||
      (environment.humidityPercent && environment.humidityPercent >= 90);

    const soilYieldLimitKPa = isRainyOrSaturated ? 3.5 : 6.0;
    const willMudSink = pressureKPa >= soilYieldLimitKPa;

    const weatherDesc = isRainyOrSaturated
      ? '雨天飽和土壤 (抗剪極限下修至 3.5 kPa)'
      : '晴天一般草坪土壤 (抗剪極限 6.0 kPa)';

    return {
      massKg,
      contactAreaCm2: areaCm2,
      forceNewtons: Number(forceN.toFixed(1)),
      pressureKPa,
      environment: {
        weather: environment.weather || 'clear',
        temperatureC: environment.temperatureC ?? 20,
        humidityPercent: environment.humidityPercent ?? 60,
        soilLimitKPa: soilYieldLimitKPa,
        description: weatherDesc
      },
      soilLimitKPa: soilYieldLimitKPa,
      willMudSink,
      phenomenon: willMudSink
        ? `壓強 ${pressureKPa} kPa ≥ 土壤剪切極限 ${soilYieldLimitKPa} kPa【${weatherDesc}】，草地必下陷踩出明顯鞋印！`
        : `壓強 ${pressureKPa} kPa < 土壤剪切極限 ${soilYieldLimitKPa} kPa【${weatherDesc}】，草葉只受彈性彎折而不陷入泥中，形成無腳印現象！`,
      formula: 'P = F / A (壓強 = 作用力 ÷ 受力面積)',
      scientificPrinciple: '108 課綱固體壓力與土壤剪切力學：當單位面積正壓力小於土壤剪切屈服強度時，泥地維持彈性承載不產生塑性凹陷形變。'
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
        name: '苦杏仁苷 (植物氰苷)',
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
      },
      counterfeit_paper: {
        name: '假鈔普通木漿紙 (含螢光增白劑)',
        excitationNm: 365,
        fluorescenceColor: '刺眼亮藍白色',
        visibleUnderNormalLight: false,
        desc: '假鈔普通木漿紙添加螢光增白劑，在 365nm 紫外燈下整張泛出刺眼亮藍白色螢光。'
      },
      genuine_currency_cotton: {
        name: '真鈔高級純棉長纖維紙漿',
        excitationNm: 365,
        fluorescenceColor: '暗黑吸光底色 (死黑無螢光)',
        visibleUnderNormalLight: false,
        desc: '真鈔高級純棉長纖維無螢光增白劑，在 365nm 紫外燈下呈現暗黑吸光底色（死黑）。'
      },
      lipophilic_microcapsule_ink: {
        name: '脂溶性微膠囊隱形防偽螢光油墨',
        excitationNm: 365,
        fluorescenceColor: '高濃度黃綠色螢光',
        visibleUnderNormalLight: false,
        desc: '脂溶性微膠囊深入指腹脊紋凹槽，擦拭無效，在 365nm 紫光下激發刺眼黃綠色螢光。'
      },
      dammar_varnish: {
        name: '達瑪天然光油 (Dammar Varnish) 殘膠',
        excitationNm: 365,
        fluorescenceColor: '特異米黃微弱螢光',
        visibleUnderNormalLight: false,
        desc: '1870 年代古典油畫達瑪光油與熟核桃油在 365nm 紫光下顯露特征黏痕。'
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

  /**
   * 8. 低溫露點凝結顯影與微環境速率演算 (Case 06 西門超商冷藏櫃指紋案)
   * 公式：露點近似公式 T_dew ≈ T_ambient - (100 - RH) / 5
   * @param {number} ambientTempC - 室內環境氣溫 (°C)
   * @param {number} surfaceTempC - 冷藏櫃玻璃表面溫度 (°C)
   * @param {number} humidityPercent - 相對濕度 (%)
   */
  runDewPointCondensationAnalysis(ambientTempC = 25, surfaceTempC = 4, humidityPercent = 80) {
    if (humidityPercent <= 0 || humidityPercent > 100) {
      return { error: '相對濕度必須在 1% ~ 100% 之間' };
    }

    // 氣象露點近似公式
    const dewPointC = Number((ambientTempC - (100 - humidityPercent) / 5).toFixed(1));
    const isCondensationTriggered = surfaceTempC <= dewPointC;

    // 顯影速率（秒）：溫差越大、濕度越高，凝結越迅速
    const tempDelta = Math.max(0.1, dewPointC - surfaceTempC);
    const condensationRateFactor = (tempDelta * (humidityPercent / 100)).toFixed(2);
    const condensationTimeSeconds = isCondensationTriggered
      ? Number(Math.max(0.8, (8 / (tempDelta + 2)) * ((100 - humidityPercent) / 20 + 0.6)).toFixed(1))
      : null;

    return {
      ambientTempC,
      surfaceTempC,
      humidityPercent,
      dewPointC,
      isCondensationTriggered,
      condensationRateFactor: Number(condensationRateFactor),
      condensationTimeSeconds,
      opticalContrast: isCondensationTriggered
        ? '玻璃表面迅速布滿微露珠產生漫散射（白濁），疏水性指紋油脂不沾水滴保持透明，反差顯現清晰指紋脊線！'
        : '表面溫度高於露點，水汽無法過飽和凝結，無法顯影！',
      scientificPrinciple: '108 課綱氣態與相變熱學：飽和水汽壓隨溫度降低而急遽下降；熱水汽遇低於露點之冷藏玻璃過飽和凝結成微米水滴，疏水性皮脂與親水玻璃表面張力差異形成光學散射對比。'
    };
  }

  /**
   * 9. 苦杏仁苷雙糖植物氰苷酵素解水解催化與雙重致病途徑演算 (CASE-01 鑑識核心)
   * 苦杏仁苷 (Amygdalin, C20H27NO11) 為天然「雙糖植物氰苷 (Cyanogenic glycoside)」。
   * 室溫中性或弱酸下分子結構極為安定，必須依賴苦杏仁酵素 (Emulsin，含 β-葡萄糖苷酶與扁桃腈裂解酶) 催化。
   * @param {number} beverageTempC - 熱飲溫度 (°C，招牌熱焦糖瑪奇朵約 65°C)
   * @param {boolean} hasEmulsinEnzyme - 是否存在苦杏仁伴生酵素 Emulsin (含 β-葡萄糖苷酶)
   * @param {string} carrierMatrix - 載體介質 ('vaseline_lipid_base' 凡士林脂質疏水膜)
   * @param {number} tlcSpotRf - 4 號桌杯蓋飲用孔凡士林殘渣 TLC 薄層層析展開比 Rf (標準值 0.42)
   */
  runAmygdalinHydrolysisAnalysis(beverageTempC = 65, hasEmulsinEnzyme = true, carrierMatrix = 'vaseline_lipid_base', tlcSpotRf = 0.42) {
    // 酵素催化活性溫度區間：45°C ~ 75°C 為理想催化水解區間；>85°C 酵素受熱變性失活；<25°C 酵素反應遲緩
    const isTempOptimal = beverageTempC >= 45 && beverageTempC <= 75;
    const isEnzymeActive = hasEmulsinEnzyme && isTempOptimal;

    // 凡士林熱融乳化判定：凡士林熔點約 38°C~60°C，遇 65°C 招牌熱焦糖瑪奇朵熱蒸氣迅速軟化並微乳化釋出酵素
    const isLipidBaseEmulsified = carrierMatrix.includes('vaseline') && beverageTempC >= 55;

    // 水解產物：氣體揮發相 (HCN 氣體 + 苯甲醛) 與未反應母體吸吮相 (苦杏仁苷雙糖氰苷)
    const hcnGasReleased = isEnzymeActive && isLipidBaseEmulsified;
    const benzaldehydeAroma = hcnGasReleased
      ? '釋出特異苦杏仁芳香苯甲醛（因招牌熱焦糖瑪奇朵淋上厚重焦糖甜香網格掩飾未被及時察覺）'
      : '未產生顯著揮發氣體';

    // TLC 檢驗母體殘留判定
    const isTlcMatched = Math.abs(tlcSpotRf - 0.42) <= 0.03;

    return {
      beverage: '招牌熱焦糖瑪奇朵',
      substanceClass: '雙糖植物氰苷 (Cyanogenic Glycoside)',
      chemicalClassification: '雙糖植物氰苷 (Cyanogenic Glycoside)',
      beverageTempC,
      carrierMatrix,
      hasEmulsinEnzyme,
      isEnzymeActive,
      isLipidBaseEmulsified,
      benzaldehydeAroma,
      pathway: {
        gasInhalation: hcnGasReleased,
        gasPhaseProduct: hcnGasReleased ? '氰化氫氣體 (HCN Gas) + 苯甲醛 (Benzaldehyde)' : '無',
        oralIngestion: '吸吮時 65°C 熱焦糖瑪奇朵奶泡沖刷吞入未完全水解之苦杏仁苷雙糖氰苷母體',
        dualToxicityMechanism: hcnGasReleased
          ? '吸吮第一時間吸入 4 號桌杯蓋狹窄氣室累積之高濃度 HCN 氣體，隨後吞入凡士林疏水膜沖刷之苦杏仁苷母體，造成氣體吸入與口腔吞嚥雙重急性中毒！'
          : '水解條件不滿足，無法產生致死反應。'
      },
      tlcVerification: {
        measuredRf: tlcSpotRf,
        standardRf: 0.42,
        isMatched: isTlcMatched,
        residualSubstance: '4 號桌外帶杯蓋飲用孔凡士林殘渣中檢出未完全水解之苦杏仁苷氰苷母體'
      },
      scientificPrinciple: '108 課綱生物化學反應與酵素催化：苦杏仁苷為雙糖植物氰苷。苦杏仁酵素（Emulsin，含 β-葡萄糖苷酶）受 65°C 招牌熱焦糖瑪奇朵弱酸熱蒸氣活化催化水解，在杯蓋狹窄氣室釋放揮發性 HCN 氣體與苯甲醛；未完全反應母體由凡士林疏水保護並經 TLC（Rf=0.42）定性確證，形成完整因果閉環。'
    };
  }

  /**
   * 10. 弱有機酸乾熱脫水炭化與 140℃ 乾熱熨斗顯影演算 (CASE-08 北投溫泉老旅店空白遺書案)
   * 排除 75℃ 潮濕水蒸氣（水蒸氣提供水分會逆向抑制脫水反應）；
   * 修正為：365nm 紫光無損初檢（柑橘類黃酮淡黃綠色自體螢光）+ 140℃ 乾熱熨斗隔吸墨紙低溫乾熨 30 秒（檸檬酸催化植物纖維脫水炭化）。
   * @param {number} ironTempC - 熨斗溫度 (°C，標準 140°C)
   * @param {number} durationSeconds - 熨燙時間 (秒，標準 30s)
   * @param {boolean} hasMoisture - 是否存在大量潮濕水蒸氣 (如 75°C 溫泉蒸氣)
   */
  runThermalIronCarbonizationAnalysis(ironTempC = 140, durationSeconds = 30, hasMoisture = false) {
    if (hasMoisture) {
      return {
        ironTempC,
        durationSeconds,
        hasMoisture,
        success: false,
        isCarbonized: false,
        isDeveloped: false,
        error: '75℃ 潮濕水蒸氣富含水分，逆向抑制檸檬酸分子間脫水炭化反應，無法顯影！必須使用 140℃ 乾熱熨斗。',
        chemicalNote: '75℃ 水蒸氣逆向抑制脫水反應',
        scientificPrinciple: '化學脫水反應平衡：弱有機酸受熱脫水生成碳質（深褐色）為失水反應；高濕度水蒸氣逆向抑制失水，唯有隔吸墨紙之乾熱高溫（135°C~150°C）方能促成植物纖維素催化炭化。'
      };
    }

    const isTempAdequate = ironTempC >= 130 && ironTempC <= 160;
    const isDurationAdequate = durationSeconds >= 20 && durationSeconds <= 45;
    const isCarbonized = isTempAdequate && isDurationAdequate;

    return {
      ironTempC,
      durationSeconds,
      hasMoisture: false,
      success: isCarbonized,
      isCarbonized,
      isDeveloped: isCarbonized,
      uvPreCheck: '365nm 紫外燈無損初檢：顯現柑橘類黃酮淡黃綠色微弱自體螢光，初步圈定隱形字跡分佈！',
      carbonizationVisual: isCarbonized
        ? '隔吸墨紙均勻乾熨 30 秒後，檸檬酸催化宣紙植物纖維素脫水炭化，浮現清晰深褐色毛筆字跡！'
        : '乾熨溫度或時間不足，炭化未完成。',
      chemicalNote: isCarbonized
        ? '140℃ 乾熱隔吸墨紙低溫乾熨 30 秒使宣紙纖維素脫水炭化'
        : '乾熨溫度或時間不足',
      legalEvidenceIntegrity: '全程錄影見證紫光初檢與乾熨顯影全過程，宣紙纖維完好無損，具備完整法定自書遺囑效力！',
      scientificPrinciple: '108 課綱有機酸熱分解與脫水反應：天然檸檬酸（Citric Acid）為三元弱有機酸，在 140°C 乾熱條件下失去結晶水並催化紙張纖維素分子間脫水炭化，生成共軛不飽和深褐色聚合碳鏈。'
    };
  }

  /**
   * 11. 1860 年代英國皇家海事旗語字母頻率破譯演算 (CASE-07 淡水海關碼頭皇家海事旗語航海箱案)
   * 128 符號航海日誌草稿，最高頻出現 16 次（佔 12.5%）對應字母「E」，破譯核心關鍵字「ANCHOR（鐵錨）」。
   * @param {number} totalSymbols - 總符號數 (128)
   * @param {number} topSymbolCount - 出現頻率最高之旗語符號次數 (16)
   */
  runSeaCipherFrequencyAnalysis(totalSymbols = 128, topSymbolCount = 16) {
    const frequencyPercent = Number(((topSymbolCount / totalSymbols) * 100).toFixed(1));
    const isMatchedToE = Math.abs(frequencyPercent - 12.7) <= 1.5; // 英文文本中 E 的統計頻率約為 12.7%

    return {
      totalSymbols,
      topSymbolCount,
      frequencyPercent: `${frequencyPercent}%`,
      frequencyMatchesLetter: isMatchedToE ? 'E (英文最高頻字母，統計頻率 12.7%)' : '非典型頻率',
      isSolved: isMatchedToE,
      decodedKeyword: 'ANCHOR',
      keywordUnlocked: 'ANCHOR',
      cipherType: '1860 年代英國皇家海事旗語',
      mechanismUnlocked: '解開 1860 年代英國寶順洋行雙動簧片死鎖阻鐵機構，滑動拼出 A-N-C-H-O-R！',
      subsoilTrace: '嫌犯沈正德涉水鞋底嵌滿淡水河上游「竹圍至紅樹林自然保護區」特有之水筆仔胚軸纖維與微鹹黑泥，戳破不在場證明！',
      scientificPrinciple: '108 課綱資訊科技與古典密碼學：單表替換式密碼保留了自然語言的統計字母頻率特徵；在長度 128 符號之西方海事密文中，出現率 12.5% 之符號精確鎖定最高頻母音字母 E，以此為破譯錨點破解關鍵字。'
    };
  }

  /**
   * 12. 實驗室金屬定量比重瓶 (Pycnometer) 恆溫秤重密度演算 (CASE-12 淡水阿給老店醬汁比重案)
   * 測得真原汁 1.25 g/cm³ vs 假醬汁（自來水調和焦糖色素）1.04 g/cm³。
   * @param {number} sampleMassGrams - 50ml 比重瓶內樣品淨重 (g)
   * @param {number} pycnometerVolumeMl - 比重瓶校準容積 (ml，標準 50ml)
   */
  runPycnometerDensityAnalysis(sampleMassGrams, pycnometerVolumeMl = 50.0) {
    if (pycnometerVolumeMl <= 0) return { error: '比重瓶容積必須大於 0' };
    const density = Number((sampleMassGrams / pycnometerVolumeMl).toFixed(2));

    let sampleType = '未知液體';
    let isCounterfeitDiluted = false;
    let isGenuine = false;

    if (Math.abs(density - 1.25) <= 0.03) {
      sampleType = '阿給老店正宗獨門濃稠原汁 (含釀造糯米醬與天然味噌，密度 1.25 g/cm³)';
      isGenuine = true;
    } else if (Math.abs(density - 1.04) <= 0.03) {
      sampleType = '稀釋假醬汁 (自來水調和焦糖色素，密度僅 1.04 g/cm³)';
      isCounterfeitDiluted = true;
    }

    return {
      sampleMassGrams,
      pycnometerVolumeMl,
      calculatedDensity: `${density} g/cm³`,
      densityGPerMl: density,
      sampleType,
      isGenuine,
      isCounterfeitDiluted,
      formula: 'ρ = m / V (密度 = 質量 ÷ 體積)',
      conclusion: isCounterfeitDiluted
        ? `比重瓶測得密度僅 ${density} g/cm³，與真原汁 1.25 g/cm³ 存在巨大比重差，當場戳破自來水混充焦糖色素之偽裝！`
        : `比重瓶測得密度 ${density} g/cm³，確認為真原汁！`,
      scientificPrinciple: '108 課綱溶液與密度測定：高精度比重瓶利用精密毛細孔溢流排除氣泡，精準秤量固定體積下之液體淨重；高濃度發酵醬汁與稀釋色素水之微觀溶質質量差形成顯著密度對比。'
    };
  }
}

module.exports = {
  EvidenceEngine
};
