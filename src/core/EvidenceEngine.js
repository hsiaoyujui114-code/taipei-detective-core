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
        name: '假鈔普通木漿紙 (含化學螢光增白劑)',
        excitationNm: 365,
        fluorescenceColor: '刺眼亮藍白色 (主波長 420~460nm)',
        visibleUnderNormalLight: false,
        desc: '假鈔普通木漿紙添加螢光增白劑，在 365nm 紫外燈下整張泛出刺眼亮藍白色螢光 (420~460nm)，與真鈔棉漿暗黑底色（死黑）對比強烈。'
      },
      genuine_currency_cotton: {
        name: '真鈔高級純棉長纖維紙漿',
        excitationNm: 365,
        fluorescenceColor: '暗黑吸光底色 (死黑無螢光)',
        visibleUnderNormalLight: false,
        desc: '真鈔高級純棉長纖維無化學螢光增白劑，在 365nm 紫外燈下呈現暗黑吸光底色（死黑）。'
      },
      lipophilic_microcapsule_ink: {
        name: '脂溶性微膠囊隱形防偽螢光油墨',
        excitationNm: 365,
        fluorescenceColor: '高濃度黃綠色螢光',
        visibleUnderNormalLight: false,
        desc: '脂溶性微膠囊深入指腹脊紋凹槽，擦拭無效，在 365nm 紫光下激發刺眼黃綠色螢光。'
      },
      dammar_varnish: {
        name: '達瑪天然樹脂光油 (Dammar Varnish) 殘膠',
        excitationNm: 365,
        fluorescenceColor: '天青色特異螢光 (主波長 460~490nm)',
        visibleUnderNormalLight: false,
        desc: '1870 年代古典油畫達瑪光油 (Dammar Varnish) 與熟核桃油在 365nm 紫光下顯露特征天青色螢光，殘留於嫌犯指縫與微距鏡頭遮光罩外緣。'
      },
      grass_cuticle_diffuse: {
        name: '禾本科草葉角質層受壓光學漫反射折射差',
        excitationNm: 365,
        fluorescenceColor: '角質層受壓光學漫反射折射差 (無凹陷泥印)',
        visibleUnderNormalLight: false,
        desc: '草葉角質層受 65cm×35cm 碳纖大排泥板鞋 3.2 kPa 壓強分攤（低於 3.5 kPa 土壤剪切極限）單向倒伏，在 365nm 紫光斜射下顯現漫反射折射差，浮現 85cm 步幅。'
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
   * 糊狀高黏度流體與金屬定量比重瓶恆溫秤重法：
   * 測得真原汁 1.25 g/cm³ vs 假稀釋水（自來水調和焦糖色素）1.04 g/cm³。
   * 高震東偷換假水後浮力感應閥卡死。
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

    const floatValveStuck = isCounterfeitDiluted;
    const floatValveMechanics = isCounterfeitDiluted
      ? '高震東偷換假稀釋水（1.04 g/cm³）後，原本殘留的高黏稠非牛頓流體原汁糊住閥門，加上假水密度不足，導致耐高壓金屬球型浮標之浮力感應閥卡死！'
      : '正宗原汁黏稠度與浮力平衡，耐高壓金屬球型浮標抗黏滯密碼槽正常運作。';

    return {
      sampleMassGrams,
      pycnometerVolumeMl,
      calculatedDensity: `${density} g/cm³`,
      densityGPerMl: density,
      fluidProperty: '高黏稠非牛頓流體 (含釀造糯米醬、味噌與紅糟澱粉勾芡)',
      sampleType,
      isGenuine,
      isCounterfeitDiluted,
      floatValveStuck,
      floatValveMechanics,
      formula: 'ρ = m / V (密度 = 質量 ÷ 體積)',
      conclusion: isCounterfeitDiluted
        ? `比重瓶測得密度僅 ${density} g/cm³，與真原汁 1.25 g/cm³ 存在巨大比重差，且引發浮力感應閥卡死，當場戳破自來水混充焦糖色素之偽裝！`
        : `比重瓶測得密度 ${density} g/cm³，確認為真原汁！`,
      scientificPrinciple: '108 課綱溶液與密度測定：高精度比重瓶利用精密毛細孔溢流排除氣泡，精準秤量固定體積下之液體淨重；高濃度發酵醬汁與稀釋色素水之微觀溶質質量差形成顯著密度對比。'
    };
  }

  /**
   * 13. 國際標準海事雙旗旗語角度幾何解碼演算 (CASE-11 淡水紅毛城英國領事官邸旗語案)
   * 標準海事旗語角度定義：
   * - C: 45° / 270°
   * - R: 90° / 270°
   * - O: 90° / 45°
   * - W: 270° / 315°
   * - P: 270° / 0°
   * 破譯密碼關鍵字：C-R-O-W (渡鴉)
   * 割畫動機：湮滅旗語解碼圖案，防止壁爐渡鴉暗格機關被破解！
   * 達瑪樹脂光油：遮光罩外緣與指縫殘留天青色螢光。
   * @param {Array<Array<number>>} anglePairs - 各信號角度組合 [[45, 270], [90, 270], [90, 45], [270, 315]]
   */
  runSemaphoreFlagAngleAnalysis(anglePairs = [[45, 270], [90, 270], [90, 45], [270, 315]]) {
    const semaphoreMap = [
      { letter: 'C', angles: [45, 270], desc: '右手斜上 45° / 左手水準左 270°' },
      { letter: 'R', angles: [90, 270], desc: '右手水準右 90° / 左手水準左 270°' },
      { letter: 'O', angles: [90, 45], desc: '右手水準右 90° / 左手斜上 45°' },
      { letter: 'W', angles: [270, 315], desc: '左手水準左 270° / 右手斜左上 315°' },
      { letter: 'P', angles: [270, 0], desc: '左手水準左 270° / 右手垂直上 0°' }
    ];

    function matchAnglePair(pair) {
      if (!Array.isArray(pair) || pair.length < 2) return '?';
      const [a1, a2] = pair;
      for (const entry of semaphoreMap) {
        const [targetA, targetB] = entry.angles;
        const directMatch = Math.abs(a1 - targetA) <= 5 && Math.abs(a2 - targetB) <= 5;
        const reverseMatch = Math.abs(a1 - targetB) <= 5 && Math.abs(a2 - targetA) <= 5;
        if (directMatch || reverseMatch) return entry.letter;
      }
      return '?';
    }

    const decodedLetters = anglePairs.map(p => matchAnglePair(p));
    const decodedWord = decodedLetters.join('');
    const isCrowMatched = decodedWord === 'CROW';

    return {
      anglePairsInput: anglePairs,
      decodedLetters,
      decodedWord,
      isCrowMatched,
      targetMechanism: '英國領事官邸二樓主臥壁爐純銅渡鴉（CROW）暗格機關',
      motiveAnalysis: '割畫動機判定：真兇割開《淡水夕照》油畫旨在「湮滅旗語解碼圖案」，企圖掩蓋渡鴉暗格開啟順序！',
      dammarVarnishEvidence: '嫌犯右手食指指縫與單眼相機微距鏡頭遮光罩外緣，檢出 1870 年代古典達瑪樹脂光油 (Dammar Varnish) 天青色特異螢光 (460~490nm)！',
      keyRecovered: '自嫌犯隨身起獲訂製三稜暗格銅鑰匙，與壁爐渡鴉暗格鎖孔 100% 嚙合！',
      scientificPrinciple: '108 課綱幾何向量與古典通訊編碼：國際海事旗語利用人體雙臂以身體中垂線為基準之極坐標離散角度（45度為增量單位）建立 26 個字母之一對一雙射映射。'
    };
  }

  /**
   * 14. 新台幣千元鈔券純棉長纖維 vs 假鈔木漿螢光鑑識演算 (CASE-13 艋舺夜市偽鈔案)
   * 真鈔：100% 頂級純長纖維棉漿，無化學螢光增白劑，365nm 下暗黑吸光（死黑底色）。
   * 假鈔：普通木漿紙添加化學螢光增白劑，365nm 下激發刺眼亮藍白螢光 (主波長 420~460nm)。
   * 流水號：同版印刷偽造流水號 FL882888UB。
   * 人物口供與身分鏈：周文彬（外送腰包無千元大鈔，送餐收到零錢）、受害人林金土（胡椒餅老店主）、真兇郭朝陽（成衣加工廠兼職打雜工）。
   */
  runCurrencyForensicAnalysis({
    paperMaterial = 'wood_pulp',
    hasOpticalBrightener = true,
    serialNumber = 'FL882888UB',
    suspectId = 'guo_chaoyang'
  } = {}) {
    const isCounterfeit = paperMaterial.includes('wood') || hasOpticalBrightener || serialNumber === 'FL882888UB';

    const fluorescenceDescription = isCounterfeit
      ? '365nm 紫光照射下，整張券面強烈激發刺眼亮藍白色螢光 (主波長 420~460nm)，電子自激發態退激發發射高能量藍白光！'
      : '365nm 紫光照射下，紙張呈現暗黑吸光底色 (死黑底色)，無任何化學螢光增白劑殘留，僅防偽纖維點狀激發！';

    return {
      paperMaterial,
      hasOpticalBrightener,
      serialNumber,
      isCounterfeit,
      fluorescenceDescription,
      serialNumberStatus: serialNumber === 'FL882888UB'
        ? '同版印刷偽造流水號【FL882888UB】，墨水無磁性無凹版印刷凸起感！'
        : '正常流水號序',
      alibiVerification: {
        courierStatement: '外送員周文彬送餐僅收取零錢，其隨身外送腰包內經搜查完全無千元大鈔，口供自洽！',
        victimStore: '艋舺廣州街夜市胡椒餅老店主林金土，於找零 900 元交易時收取該偽鈔',
        culpritIdentity: '郭朝陽（成衣加工廠兼職打雜工），利用職務之便燙印裁切偽鈔',
        incidentLocation: '萬華龍山寺後巷與青草巷徒步區'
      },
      scientificPrinciple: '108 課綱有機光化學與分子激發：化學螢光增白劑（雙二苯乙烯類化合物）分子吸收 365nm 近紫外光電子躍遷至第一激發單重態，退激發時在 420~460nm 藍光區釋放強烈螢光；真鈔純長纖維棉漿不含共軛發色增白基團，保持光學死黑吸光性。'
    };
  }

  /**
   * 15. 古典 5×5 漢字矩陣與五行相生置換旋轉解碼演算 (CASE-14 剝皮寮歷史街區藥籤暗語案)
   * 五行相生次序：木 ➔ 火 ➔ 土 ➔ 金 ➔ 水 ➔ 木。
   * 依五行相生置換旋轉提取，解碼 12 字藏寶座標：『福祥街三進中柱雀替斗栱下』！
   * 暗格現場狀態：高處雀替暗格昨夜未被開啟，封塵未動！
   * 指紋遺留：展櫃玻璃、去光水瓶身、黃紙抄錄草稿背面。
   */
  runFiveElementsMatrixAnalysis(matrix5x5, elementSequence = ['木', '火', '土', '金', '水']) {
    // 預設 5x5 藥籤漢字矩陣（依《本草綱目》藥材五行性味分類排列）
    const defaultGrid = [
      ['福', '青', '柴', '黃', '祥'],
      ['當', '街', '連', '三', '歸'],
      ['厚', '進', '中', '柱', '朴'],
      ['白', '芍', '雀', '替', '朮'],
      ['斗', '栱', '下', '甘', '草']
    ];

    const targetCoordinate = '福祥街三進中柱雀替斗栱下';

    return {
      matrixDimension: '5 × 5 漢字矩陣 (25 字)',
      elementSequenceRule: '五行相生次序：木生火、火生土、土生金、金生水、水生木',
      decodedCoordinate: targetCoordinate,
      characterCount: 12,
      hiddenChamberStatus: {
        location: '剝皮寮歷史街區福祥街老中藥行三進木構造高處雀替斗栱暗格',
        isOpenedLastNight: false,
        dustIntegrity: '暗格位於離地 3.5 米高處，昨夜未被開啟！暗格邊縫陳年積塵與蛛網完全完好未動，內部《青草防癘驗方手札》完好未失！',
        rationale: '真兇受限於作案時間與高度工具不足，昨夜僅成功用去光水溶膠抄錄展櫃內的藥籤密碼草稿，尚未動手開啟高處雀替暗格！'
      },
      latentFingerprints: [
        '展櫃玻璃外框下緣左手支撐掌紋',
        '丟棄於洗手槽之乙酸乙酯去光水瓶身指紋',
        '嫌犯隨身起獲之黃紙抄錄草稿背面右手食指清晰脊紋'
      ],
      scientificPrinciple: '108 課綱矩陣轉換與古典密碼學：二維矩陣置換密碼透過預設置換向量（Permutation Vector）打亂字元空間分佈；結合傳統五行性味分類法作為公鑰，唯有掌握五行生剋運算子方能還原空間幾何座標。'
    };
  }

  /**
   * 16. 乙酸乙酯 (Ethyl Acetate) 揮發殘留質譜氣相鑑識 (CASE-14 去光水溶劑殘留)
   * 乙酸乙酯 (CH3COOCH2CH3，沸點 77.1°C，去光水主要溶劑)。
   * 嫌犯使用去光水溶解藥籤展櫃封膠。
   * 取樣部位：風衣右袖口內襯、右手食指與無名指尖。
   */
  runEthylAcetateResidueAnalysis(sampleLocation = 'coat_cuff_and_fingertips') {
    return {
      substance: '乙酸乙酯 (Ethyl Acetate, CH3COOCH2CH3)',
      solventType: '化妝品指甲油去光水主要有機溶劑 (沸點 77.1°C，強揮發性與特異果香)',
      sampleLocation,
      samplingPoints: [
        '嫌犯黑色長版風衣右袖口內襯纖維',
        '嫌犯右手食指指腹表皮皮脂凹槽',
        '嫌犯右手無名指指尖微痕'
      ],
      retentionTimeMinutes: 2.35,
      characteristicMassPeaks: [
        { mz: 43, fragment: 'CH3CO+ (乙醯基碎片峰，基峰 100%)' },
        { mz: 61, fragment: 'CH3C(OH)2+ (質子化乙酸峰)' },
        { mz: 88, fragment: 'C4H8O2+ (分子離子峰 M+)' }
      ],
      isIdentified: true,
      forensicConclusion: '風衣右袖口內襯與右手食指、無名指尖均檢出高濃度乙酸乙酯揮發殘留，與現場遺棄之去光水瓶成分 100% 吻合，證實嫌犯親手塗抹溶劑軟化展櫃壓克力膠封！',
      scientificPrinciple: '108 課綱有機化合物與色譜質譜分析：酯類低分子量化合物具備特徵沸點與質譜斷裂特徵；氣相色譜（GC-MS）藉由保留時間與特徵碎片質荷比（m/z 43, 61, 88）達成超微量有機溶劑絕對定性。'
    };
  }
}

module.exports = {
  EvidenceEngine
};
