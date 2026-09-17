(function initializeFormCardProjection(scope) {
  "use strict";

  const DISPLAY_ONLY_FIELDS = new Set([
    "sourceId",
    "slug",
    "dexNo",
    "primaryName",
    "availableNames",
    "sourceUrl",
    "form",
    "baseFormLabel",
    "baseFormSegmentLabel",
    "baseFormSegmentOrder",
    "baseFormSegmentType",
    "spriteQuery",
    "consumerDisplayMode"
  ]);

  function stableValue(value) {
    if (Array.isArray(value)) {
      return value.map(stableValue);
    }
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.keys(value)
          .sort()
          .map(key => [key, stableValue(value[key])])
      );
    }
    return value;
  }

  function battleSignature(species) {
    const battleFields = Object.fromEntries(
      Object.entries(species)
        .filter(([key]) => !DISPLAY_ONLY_FIELDS.has(key))
        .sort(([left], [right]) => left.localeCompare(right))
    );
    return JSON.stringify(stableValue(battleFields));
  }

  function selectDefaultForm(speciesGroup) {
    return speciesGroup.find(species => species.baseFormLabel && species.baseFormLabel !== "Base form")
      || speciesGroup[0];
  }

  function projectDefaultBattleCards(speciesList) {
    const groups = new Map();
    for (const species of speciesList) {
      const key = String(species.dexNo);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(species);
    }

    const hiddenSlugs = new Set();
    const aliases = {};
    const mergedNames = new Map();
    const collapsedGroups = [];

    for (const speciesGroup of groups.values()) {
      if (speciesGroup.length < 2) {
        continue;
      }
      const defaultSpecies = selectDefaultForm(speciesGroup);
      const defaultSignature = battleSignature(defaultSpecies);
      const collapsed = [];

      for (const species of speciesGroup) {
        if (species === defaultSpecies || battleSignature(species) !== defaultSignature) {
          continue;
        }
        hiddenSlugs.add(species.slug);
        aliases[species.slug] = defaultSpecies.slug;
        collapsed.push(species.slug);
        const names = mergedNames.get(defaultSpecies.slug) || [
          ...(defaultSpecies.availableNames || []),
          defaultSpecies.primaryName
        ];
        names.push(...(species.availableNames || []), species.primaryName);
        mergedNames.set(defaultSpecies.slug, names);
      }

      if (collapsed.length) {
        collapsedGroups.push({
          defaultSlug: defaultSpecies.slug,
          hiddenSlugs: collapsed
        });
      }
    }

    const projectedSpecies = speciesList
      .filter(species => !hiddenSlugs.has(species.slug))
      .map(species => {
        const names = mergedNames.get(species.slug);
        return names
          ? { ...species, availableNames: [...new Set(names.filter(Boolean))] }
          : species;
      });

    return {
      species: projectedSpecies,
      aliases,
      collapsedGroups
    };
  }

  function squawkabillyColor(species) {
    const form = String(species?.form || "").trim().toLowerCase();
    return ["green", "blue", "yellow", "white"].includes(form) ? form : "";
  }

  function squawkabillyLabel(color) {
    return `Squawkabilly ${color[0].toUpperCase()}${color.slice(1)}`;
  }

  function squawkabillySpriteQuery(species, color) {
    return {
      ...(species.spriteQuery || {}),
      species: species.spriteQuery?.species || "Squawkabilly",
      nationalDex: species.spriteQuery?.nationalDex || species.dexNo,
      form: color
    };
  }

  function squawkabillyNames(records, colors) {
    return [...new Set([
      ...records.flatMap(species => species.availableNames || []),
      ...records.map(species => species.primaryName),
      ...colors.map(squawkabillyLabel),
      ...colors.map(color => `Squawkabilly-${color[0].toUpperCase()}${color.slice(1)}`)
    ].filter(name => name && !/\bPlumage\b/iu.test(name)))];
  }

  function squawkabillySelectableForm(species, color) {
    const label = squawkabillyLabel(color);
    return {
      sourceId: species.sourceId,
      id: color,
      label,
      shortLabel: label.replace(/^Squawkabilly\s+/u, ""),
      segmentLabel: color[0].toUpperCase(),
      stats: species.baseStats,
      abilities: species.abilities,
      types: species.types,
      spriteQuery: squawkabillySpriteQuery(species, color)
    };
  }

  function projectSquawkabillyColorCards(speciesList) {
    const records = speciesList.filter(species => Number(species.dexNo) === 931 && squawkabillyColor(species));
    const byColor = new Map(records.map(species => [squawkabillyColor(species), species]));
    const replacements = new Map();
    const hiddenSlugs = new Set();
    const aliases = {};
    const collapsedGroups = [];

    for (const [defaultColor, alternateColor] of [["green", "blue"], ["yellow", "white"]]) {
      const defaultSpecies = byColor.get(defaultColor);
      const alternateSpecies = byColor.get(alternateColor);
      if (!defaultSpecies || !alternateSpecies || battleSignature(defaultSpecies) !== battleSignature(alternateSpecies)) {
        continue;
      }

      const defaultLabel = squawkabillyLabel(defaultColor);
      replacements.set(defaultSpecies.slug, {
        ...defaultSpecies,
        primaryName: defaultLabel,
        availableNames: squawkabillyNames([defaultSpecies, alternateSpecies], [defaultColor, alternateColor]),
        baseFormLabel: defaultLabel.replace(/^Squawkabilly\s+/u, ""),
        baseFormSegmentLabel: defaultColor[0].toUpperCase(),
        spriteQuery: squawkabillySpriteQuery(defaultSpecies, defaultColor),
        embeddedSelectableForms: [squawkabillySelectableForm(alternateSpecies, alternateColor)]
      });
      hiddenSlugs.add(alternateSpecies.slug);
      aliases[alternateSpecies.slug] = defaultSpecies.slug;
      collapsedGroups.push({
        defaultSlug: defaultSpecies.slug,
        hiddenSlugs: [alternateSpecies.slug]
      });
    }

    return {
      species: speciesList
        .filter(species => !hiddenSlugs.has(species.slug))
        .map(species => replacements.get(species.slug) || species),
      aliases,
      collapsedGroups
    };
  }

  function projectGourgeistSizeCard(speciesList) {
    return speciesList.map(species => {
      if (species.slug !== "gourgeist") return species;
      return {
        ...species,
        primaryName: "Gourgeist Medium",
        availableNames: [...new Set([
          ...(species.availableNames || []),
          species.primaryName,
          "Gourgeist Medium",
          "Gourgeist-Medium"
        ].filter(Boolean))],
        baseFormLabel: "Medium",
        baseFormSegmentLabel: "M",
        spriteQuery: {
          ...(species.spriteQuery || {}),
          species: species.spriteQuery?.species || "Gourgeist",
          nationalDex: species.spriteQuery?.nationalDex || species.dexNo,
          form: "average"
        }
      };
    });
  }

  function projectCastformTypeSegments(speciesList) {
    const formTypes = new Map([
      ["sunny", { order: 1, type: "Fire" }],
      ["rainy", { order: 2, type: "Water" }],
      ["snowy", { order: 3, type: "Ice" }]
    ]);
    return speciesList.map(species => {
      if (species.slug !== "castform") return species;
      return {
        ...species,
        baseFormSegmentLabel: "Normal",
        baseFormSegmentOrder: 0,
        baseFormSegmentType: "Normal",
        battleForms: (species.battleForms || []).map(form => {
          const presentation = formTypes.get(form.id);
          return presentation
            ? {
                ...form,
                segmentLabel: presentation.type,
                segmentOrder: presentation.order,
                segmentType: presentation.type
              }
            : form;
        })
      };
    });
  }

  function consumerCardBattleSignature(species) {
    return JSON.stringify(stableValue({
      abilities: species?.abilities || [],
      baseStats: species?.baseStats || {},
      moves: species?.moves || [],
      types: species?.types || []
    }));
  }

  function projectConsumerDisplayRecords(speciesList) {
    const visibleByDex = new Map();
    for (const species of speciesList) {
      if (species.consumerDisplayMode === "embedded") continue;
      const key = String(species.dexNo);
      if (!visibleByDex.has(key)) visibleByDex.set(key, []);
      visibleByDex.get(key).push(species);
    }

    return speciesList.filter(species => {
      if (species.consumerDisplayMode !== "embedded") return true;
      const code = getRecordGenderCode(species);
      if (!code) return false;
      return (visibleByDex.get(String(species.dexNo)) || []).some(candidate => {
        const candidateCode = getRecordGenderCode(candidate);
        return candidateCode && candidateCode !== code
          && consumerCardBattleSignature(candidate) !== consumerCardBattleSignature(species);
      });
    });
  }

  function projectMimikyuDefaultCard(speciesList) {
    return speciesList.map(species => {
      if (species.slug !== "mimikyu") return species;
      return {
        ...species,
        battleForms: (species.battleForms || []).filter(form => form.id !== "busted")
      };
    });
  }

  function projectChampionFormCards(speciesList) {
    const displayRecords = projectConsumerDisplayRecords(speciesList);
    const mimikyuProjection = projectMimikyuDefaultCard(displayRecords);
    const castformProjection = projectCastformTypeSegments(mimikyuProjection);
    const gourgeistProjection = projectGourgeistSizeCard(castformProjection);
    const squawkabillyProjection = projectSquawkabillyColorCards(gourgeistProjection);
    const defaultProjection = projectDefaultBattleCards(squawkabillyProjection.species);
    return {
      species: defaultProjection.species,
      aliases: { ...squawkabillyProjection.aliases, ...defaultProjection.aliases },
      collapsedGroups: [...squawkabillyProjection.collapsedGroups, ...defaultProjection.collapsedGroups]
    };
  }

  function genderCode(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === "m" || normalized === "male") return "M";
    if (normalized === "f" || normalized === "female") return "F";
    return "";
  }

  function getRecordGenderCode(record) {
    return genderCode(record?.form)
      || genderCode(record?.gender)
      || genderCode(record?.spriteQuery?.gender)
      || genderCode(record?.id)
      || genderCode(record?.shortLabel)
      || genderCode(String(record?.label || "").split(/\s+/u).at(-1));
  }

  function genderWord(code) {
    return code === "F" ? "Female" : "Male";
  }

  function getGenderBaseName(speciesGroup) {
    const queryName = speciesGroup.find(species => species.spriteQuery?.species)?.spriteQuery?.species;
    if (queryName) return queryName;
    return String(speciesGroup[0]?.primaryName || "")
      .replace(/(?:\s+|-)(?:Male|Female|M|F)$/iu, "")
      .trim();
  }

  function getGenderNames(existingNames, oldName, baseName, code) {
    const word = genderWord(code);
    const oppositeWord = code === "F" ? "Male" : "Female";
    const oppositeCode = code === "F" ? "M" : "F";
    const oppositePattern = new RegExp(`(?:^${oppositeWord}\\s|(?:\\s+|-)${oppositeWord}$|(?:\\s+|-)${oppositeCode}$)`, "iu");
    return [...new Set([
      ...(existingNames || []).filter(name => !oppositePattern.test(name)),
      oldName,
      `${baseName} ${code}`,
      `${baseName} ${word}`,
      `${baseName}-${code}`,
      `${word} ${baseName}`
    ].filter(Boolean))];
  }

  function getGenderSpriteQuery(record, baseName, nationalDex, code) {
    return {
      ...(record?.spriteQuery || {}),
      species: record?.spriteQuery?.species || baseName,
      nationalDex: record?.spriteQuery?.nationalDex || record?.spriteQuery?.dexNo || nationalDex,
      form: code === "F" ? "female" : "male",
      gender: code === "F" ? "female" : "male"
    };
  }

  function projectGenderBattleForms(speciesList) {
    const groups = new Map();
    for (const species of speciesList) {
      const key = String(species.dexNo);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(species);
    }

    const pairedGroups = new Map();
    const independentCodesByGroup = new Map();
    for (const [key, speciesGroup] of groups) {
      const codes = new Set();
      const independentCodes = new Set();
      for (const species of speciesGroup) {
        const code = getRecordGenderCode(species);
        if (code) {
          codes.add(code);
          independentCodes.add(code);
        }
        for (const form of species.embeddedSelectableForms || []) {
          const formCode = getRecordGenderCode(form);
          if (formCode) codes.add(formCode);
        }
      }
      if (codes.has("M") && codes.has("F")) {
        pairedGroups.set(key, getGenderBaseName(speciesGroup));
        independentCodesByGroup.set(key, independentCodes);
      }
    }

    return speciesList.map(species => {
      const baseName = pairedGroups.get(String(species.dexNo));
      if (!baseName) return species;

      const code = getRecordGenderCode(species);
      const projected = code ? {
        ...species,
        primaryName: `${baseName} ${code}`,
        availableNames: getGenderNames(species.availableNames, species.primaryName, baseName, code),
        baseFormLabel: code,
        spriteQuery: getGenderSpriteQuery(species, baseName, species.dexNo, code)
      } : { ...species };

      if (Array.isArray(species.embeddedSelectableForms)) {
        const independentCodes = independentCodesByGroup.get(String(species.dexNo)) || new Set();
        projected.embeddedSelectableForms = species.embeddedSelectableForms.filter(form => {
          const formCode = getRecordGenderCode(form);
          return !formCode || !independentCodes.has(formCode);
        }).map(form => {
          const formCode = getRecordGenderCode(form);
          if (!formCode) return form;
          return {
            ...form,
            label: `${baseName} ${formCode}`,
            shortLabel: formCode,
            spriteQuery: getGenderSpriteQuery(form, baseName, species.dexNo, formCode)
          };
        });
      }

      return projected;
    });
  }

  scope.ChampionsFormCardProjection = Object.freeze({
    battleSignature,
    projectCastformTypeSegments,
    projectChampionFormCards,
    projectConsumerDisplayRecords,
    projectDefaultBattleCards,
    projectGourgeistSizeCard,
    projectGenderBattleForms,
    projectMimikyuDefaultCard,
    projectSquawkabillyColorCards
  });
})(globalThis);
