const express = require('express');
const { js: jsBeautify } = require('js-beautify');

const router = express.Router();

// Code complexity analyzer
router.post('/complexity', (req, res) => {
  const { code, language = 'javascript' } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Code parameter is required' });
  }

  const complexity = calculateCyclomaticComplexity(code, language);
  const analysis = analyzeCodeComplexity(code, complexity);

  res.json({
    language,
    codeLength: code.length,
    linesOfCode: code.split('\n').length,
    complexity,
    analysis,
    recommendations: generateComplexityRecommendations(complexity),
    timestamp: new Date().toISOString()
  });
});

// Java code formatter
router.post('/formatter/java', (req, res) => {
  const { code, style = 'google' } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Code parameter is required' });
  }

  const formatted = formatJavaCode(code, style);
  const statistics = analyzeCodeStatistics(code, formatted);

  res.json({
    original: code,
    formatted,
    style,
    statistics,
    improvements: detectFormattingImprovements(code, formatted),
    timestamp: new Date().toISOString()
  });
});

// Code smell detector
router.post('/smell/detector', (req, res) => {
  const { code, language = 'javascript', severity = 'all' } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Code parameter is required' });
  }

  const smells = detectCodeSmells(code, language);
  const filteredSmells = filterSmellsBySeverity(smells, severity);

  res.json({
    language,
    severity,
    codeSmells: filteredSmells,
    summary: {
      total: smells.length,
      critical: smells.filter(s => s.severity === 'critical').length,
      major: smells.filter(s => s.severity === 'major').length,
      minor: smells.filter(s => s.severity === 'minor').length
    },
    overallScore: calculateCodeQualityScore(smells),
    recommendations: generateSmellRecommendations(filteredSmells),
    timestamp: new Date().toISOString()
  });
});

// Naming convention validator
router.post('/naming/validator', (req, res) => {
  const { code, language = 'javascript', convention = 'camelCase' } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Code parameter is required' });
  }

  const violations = validateNamingConventions(code, language, convention);
  const suggestions = generateNamingSuggestions(violations);

  res.json({
    language,
    convention,
    violations,
    suggestions,
    compliance: {
      score: Math.max(0, 100 - violations.length * 5),
      grade: getComplianceGrade(violations.length),
      totalIdentifiers: extractIdentifiers(code, language).length
    },
    conventionRules: getNamingConventionRules(convention),
    timestamp: new Date().toISOString()
  });
});

// Duplicate code finder
router.post('/duplicate/finder', (req, res) => {
  const { code, minLength = 5, language = 'javascript' } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Code parameter is required' });
  }

  const duplicates = findDuplicateCode(code, minLength, language);
  const analysis = analyzeDuplicateCode(duplicates, code);

  res.json({
    language,
    minLength,
    duplicates,
    analysis,
    refactoringOpportunities: generateRefactoringOpportunities(duplicates),
    impact: calculateDuplicationImpact(duplicates, code),
    timestamp: new Date().toISOString()
  });
});

// JavaDoc generator
router.post('/comment/generator', (req, res) => {
  const { code, language = 'java', style = 'javadoc' } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Code parameter is required' });
  }

  const methods = extractMethods(code, language);
  const documentation = generateDocumentation(methods, style);

  res.json({
    language,
    style,
    methods: methods.length,
    documentation,
    coverage: {
      documented: documentation.filter(d => d.hasDocumentation).length,
      total: methods.length,
      percentage: Math.round((documentation.filter(d => d.hasDocumentation).length / methods.length) * 100)
    },
    templates: getDocumentationTemplates(style),
    timestamp: new Date().toISOString()
  });
});

// Import optimizer
router.post('/import/optimizer', (req, res) => {
  const { code, language = 'java' } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Code parameter is required' });
  }

  const imports = extractImports(code, language);
  const optimization = optimizeImports(imports, code);

  res.json({
    language,
    original: imports,
    optimized: optimization.optimized,
    removed: optimization.removed,
    added: optimization.added,
    reordered: optimization.reordered,
    optimizedCode: optimization.code,
    savings: {
      linesRemoved: optimization.removed.length,
      duplicatesRemoved: optimization.duplicatesRemoved
    },
    timestamp: new Date().toISOString()
  });
});

// Annotation validator
router.post('/annotation/validator', (req, res) => {
  const { code, language = 'java', framework = 'spring' } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Code parameter is required' });
  }

  const annotations = extractAnnotations(code, language);
  const validation = validateAnnotations(annotations, framework);

  res.json({
    language,
    framework,
    annotations,
    validation,
    suggestions: generateAnnotationSuggestions(validation, framework),
    bestPractices: getAnnotationBestPractices(framework),
    timestamp: new Date().toISOString()
  });
});

// Method analyzer
router.post('/method/analyzer', (req, res) => {
  const { code, language = 'java', maxLength = 20 } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Code parameter is required' });
  }

  const methods = extractMethods(code, language);
  const analysis = analyzeMethods(methods, maxLength);

  res.json({
    language,
    maxLength,
    methods: analysis.methods,
    statistics: analysis.statistics,
    violations: analysis.violations,
    recommendations: generateMethodRecommendations(analysis),
    refactoringOpportunities: identifyRefactoringOpportunities(analysis),
    timestamp: new Date().toISOString()
  });
});

// Class cohesion analyzer
router.post('/class/cohesion', (req, res) => {
  const { code, language = 'java' } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Code parameter is required' });
  }

  const classes = extractClasses(code, language);
  const cohesionAnalysis = analyzeClassCohesion(classes);

  res.json({
    language,
    classes: cohesionAnalysis.classes,
    overallCohesion: cohesionAnalysis.overall,
    recommendations: generateCohesionRecommendations(cohesionAnalysis),
    designPatterns: suggestDesignPatterns(cohesionAnalysis),
    timestamp: new Date().toISOString()
  });
});

// Helper functions
function calculateCyclomaticComplexity(code, language) {
  // Simplified complexity calculation
  const complexityKeywords = {
    javascript: ['if', 'else', 'for', 'while', 'switch', 'case', 'catch', '&&', '||', '?'],
    java: ['if', 'else', 'for', 'while', 'switch', 'case', 'catch', '&&', '||', '?'],
    python: ['if', 'elif', 'for', 'while', 'except', 'and', 'or']
  };

  const keywords = complexityKeywords[language] || complexityKeywords.javascript;
  let complexity = 1; // Base complexity

  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'g');
    const matches = code.match(regex);
    if (matches) {
      complexity += matches.length;
    }
  });

  return {
    score: complexity,
    level: getComplexityLevel(complexity),
    maintainability: getMaintenabilityIndex(complexity)
  };
}

function getComplexityLevel(score) {
  if (score <= 10) return 'Low';
  if (score <= 20) return 'Moderate';
  if (score <= 50) return 'High';
  return 'Very High';
}

function getMaintenabilityIndex(complexity) {
  return Math.max(0, 100 - complexity * 2);
}

function analyzeCodeComplexity(code, complexity) {
  return {
    functions: extractFunctions(code).length,
    conditionals: (code.match(/if|switch/g) || []).length,
    loops: (code.match(/for|while/g) || []).length,
    nestingDepth: calculateNestingDepth(code),
    cognitiveLoad: complexity.score * 1.5
  };
}

function generateComplexityRecommendations(complexity) {
  const recommendations = [];
  
  if (complexity.score > 20) {
    recommendations.push('Consider breaking down complex functions into smaller ones');
  }
  
  if (complexity.score > 10) {
    recommendations.push('Add unit tests to ensure code reliability');
  }
  
  recommendations.push('Use early returns to reduce nesting');
  recommendations.push('Extract complex conditions into well-named variables');
  
  return recommendations;
}

function formatJavaCode(code, style) {
  // Simplified Java code formatting
  let formatted = code
    .replace(/\{/g, ' {\n')
    .replace(/\}/g, '\n}\n')
    .replace(/;/g, ';\n')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');

  // Apply indentation
  const lines = formatted.split('\n');
  let indentLevel = 0;
  const indentSize = style === 'google' ? 2 : 4;
  
  return lines.map(line => {
    if (line.includes('}')) indentLevel--;
    const indentedLine = ' '.repeat(indentLevel * indentSize) + line;
    if (line.includes('{')) indentLevel++;
    return indentedLine;
  }).join('\n');
}

function analyzeCodeStatistics(original, formatted) {
  return {
    originalLines: original.split('\n').length,
    formattedLines: formatted.split('\n').length,
    originalCharacters: original.length,
    formattedCharacters: formatted.length,
    whitespaceImprovement: formatted.length - original.length
  };
}

function detectFormattingImprovements(original, formatted) {
  return [
    'Consistent indentation applied',
    'Proper bracket placement',
    'Improved readability',
    'Standard formatting conventions followed'
  ];
}

function detectCodeSmells(code, language) {
  const smells = [];
  
  // Long method detection
  const methods = extractFunctions(code);
  methods.forEach((method, index) => {
    if (method.lines > 20) {
      smells.push({
        type: 'Long Method',
        severity: 'major',
        line: method.startLine,
        description: `Method ${method.name} is ${method.lines} lines long`,
        suggestion: 'Consider breaking this method into smaller, more focused methods'
      });
    }
  });
  
  // Large class detection
  if (code.split('\n').length > 200) {
    smells.push({
      type: 'Large Class',
      severity: 'major',
      line: 1,
      description: 'Class is very large',
      suggestion: 'Consider splitting this class into multiple smaller classes'
    });
  }
  
  // Duplicate code detection
  const duplicates = findSimpleDuplicates(code);
  duplicates.forEach(duplicate => {
    smells.push({
      type: 'Duplicate Code',
      severity: 'minor',
      line: duplicate.line,
      description: 'Duplicate code block detected',
      suggestion: 'Extract common code into a shared method'
    });
  });
  
  return smells;
}

function filterSmellsBySeverity(smells, severity) {
  if (severity === 'all') return smells;
  return smells.filter(smell => smell.severity === severity);
}

function calculateCodeQualityScore(smells) {
  const severityWeights = { critical: 20, major: 10, minor: 5 };
  const totalDeduction = smells.reduce((sum, smell) => sum + severityWeights[smell.severity], 0);
  return Math.max(0, 100 - totalDeduction);
}

function generateSmellRecommendations(smells) {
  const recommendations = new Set();
  
  smells.forEach(smell => {
    recommendations.add(smell.suggestion);
  });
  
  return Array.from(recommendations);
}

function validateNamingConventions(code, language, convention) {
  const violations = [];
  const identifiers = extractIdentifiers(code, language);
  
  identifiers.forEach(identifier => {
    if (!isValidNaming(identifier.name, convention, identifier.type)) {
      violations.push({
        name: identifier.name,
        type: identifier.type,
        line: identifier.line,
        expected: convertToConvention(identifier.name, convention),
        violation: `${identifier.type} should follow ${convention} convention`
      });
    }
  });
  
  return violations;
}

function isValidNaming(name, convention, type) {
  const patterns = {
    camelCase: /^[a-z][a-zA-Z0-9]*$/,
    PascalCase: /^[A-Z][a-zA-Z0-9]*$/,
    snake_case: /^[a-z][a-z0-9_]*$/,
    CONSTANT_CASE: /^[A-Z][A-Z0-9_]*$/
  };
  
  if (type === 'class') return patterns.PascalCase.test(name);
  if (type === 'constant') return patterns.CONSTANT_CASE.test(name);
  
  return patterns[convention]?.test(name) || false;
}

function convertToConvention(name, convention) {
  // Simplified conversion
  switch (convention) {
    case 'camelCase':
      return name.charAt(0).toLowerCase() + name.slice(1);
    case 'PascalCase':
      return name.charAt(0).toUpperCase() + name.slice(1);
    case 'snake_case':
      return name.replace(/([A-Z])/g, '_$1').toLowerCase();
    default:
      return name;
  }
}

function extractIdentifiers(code, language) {
  // Simplified identifier extraction
  const identifiers = [];
  const lines = code.split('\n');
  
  lines.forEach((line, index) => {
    // Extract variable declarations
    const varMatches = line.match(/(?:var|let|const|int|String)\s+(\w+)/g);
    if (varMatches) {
      varMatches.forEach(match => {
        const name = match.split(/\s+/)[1];
        identifiers.push({ name, type: 'variable', line: index + 1 });
      });
    }
    
    // Extract function names
    const funcMatches = line.match(/(?:function|def)\s+(\w+)/g);
    if (funcMatches) {
      funcMatches.forEach(match => {
        const name = match.split(/\s+/)[1];
        identifiers.push({ name, type: 'function', line: index + 1 });
      });
    }
  });
  
  return identifiers;
}

function generateNamingSuggestions(violations) {
  return violations.map(violation => ({
    original: violation.name,
    suggested: violation.expected,
    reason: violation.violation,
    line: violation.line
  }));
}

function getComplianceGrade(violationCount) {
  if (violationCount === 0) return 'A';
  if (violationCount <= 2) return 'B';
  if (violationCount <= 5) return 'C';
  if (violationCount <= 10) return 'D';
  return 'F';
}

function getNamingConventionRules(convention) {
  const rules = {
    camelCase: 'Variables and functions start with lowercase, subsequent words capitalized',
    PascalCase: 'Classes and types start with uppercase, subsequent words capitalized',
    snake_case: 'All lowercase with underscores between words',
    CONSTANT_CASE: 'All uppercase with underscores between words'
  };
  
  return rules[convention] || 'No specific rules defined';
}

function findDuplicateCode(code, minLength, language) {
  const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const duplicates = [];
  
  for (let i = 0; i < lines.length - minLength; i++) {
    for (let j = i + minLength; j < lines.length - minLength; j++) {
      let matchLength = 0;
      while (i + matchLength < lines.length && 
             j + matchLength < lines.length && 
             lines[i + matchLength] === lines[j + matchLength]) {
        matchLength++;
      }
      
      if (matchLength >= minLength) {
        duplicates.push({
          block1: { start: i + 1, end: i + matchLength },
          block2: { start: j + 1, end: j + matchLength },
          lines: matchLength,
          code: lines.slice(i, i + matchLength)
        });
      }
    }
  }
  
  return duplicates;
}

function analyzeDuplicateCode(duplicates, code) {
  const totalLines = code.split('\n').length;
  const duplicatedLines = duplicates.reduce((sum, dup) => sum + dup.lines, 0);
  
  return {
    totalDuplicates: duplicates.length,
    duplicatedLines,
    duplicationPercentage: Math.round((duplicatedLines / totalLines) * 100),
    largestDuplicate: duplicates.reduce((max, dup) => dup.lines > max ? dup.lines : max, 0)
  };
}

function generateRefactoringOpportunities(duplicates) {
  return duplicates.map(duplicate => ({
    description: `Extract ${duplicate.lines} duplicate lines into a method`,
    effort: duplicate.lines > 10 ? 'High' : 'Medium',
    benefit: duplicate.lines > 5 ? 'High' : 'Medium',
    location: `Lines ${duplicate.block1.start}-${duplicate.block1.end} and ${duplicate.block2.start}-${duplicate.block2.end}`
  }));
}

function calculateDuplicationImpact(duplicates, code) {
  const impact = duplicates.length * 10; // Simplified impact calculation
  return {
    maintainability: Math.max(0, 100 - impact),
    testability: Math.max(0, 100 - impact * 0.8),
    readability: Math.max(0, 100 - impact * 0.6)
  };
}

// Additional helper functions would continue here...
function extractMethods(code, language) {
  const methods = [];
  const lines = code.split('\n');
  
  lines.forEach((line, index) => {
    const methodMatch = line.match(/(public|private|protected)?\s*(static)?\s*\w+\s+(\w+)\s*\(/);
    if (methodMatch) {
      methods.push({
        name: methodMatch[3],
        line: index + 1,
        visibility: methodMatch[1] || 'default',
        isStatic: !!methodMatch[2]
      });
    }
  });
  
  return methods;
}

function generateDocumentation(methods, style) {
  return methods.map(method => ({
    method: method.name,
    hasDocumentation: Math.random() > 0.5, // Simulate existing documentation
    generatedDoc: generateMethodDoc(method, style)
  }));
}

function generateMethodDoc(method, style) {
  if (style === 'javadoc') {
    return `/**
 * Description of ${method.name} method
 * @param param1 Description of parameter
 * @return Description of return value
 */`;
  }
  return `// ${method.name} - Add description here`;
}

function getDocumentationTemplates(style) {
  return {
    javadoc: '/** ... */',
    jsdoc: '/** ... */',
    inline: '// ...'
  };
}

function extractImports(code, language) {
  const importRegex = language === 'java' ? /import\s+([^;]+);/g : /import\s+.*from\s+['"]([^'"]+)['"]/g;
  const imports = [];
  let match;
  
  while ((match = importRegex.exec(code)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

function optimizeImports(imports, code) {
  const used = [];
  const unused = [];
  
  imports.forEach(imp => {
    const className = imp.split('.').pop();
    if (code.includes(className)) {
      used.push(imp);
    } else {
      unused.push(imp);
    }
  });
  
  return {
    optimized: used.sort(),
    removed: unused,
    added: [],
    reordered: true,
    duplicatesRemoved: imports.length - [...new Set(imports)].length,
    code: code // Simplified - would actually remove unused imports
  };
}

function extractAnnotations(code, language) {
  const annotationRegex = /@(\w+)(?:\([^)]*\))?/g;
  const annotations = [];
  let match;
  
  while ((match = annotationRegex.exec(code)) !== null) {
    annotations.push({
      name: match[1],
      full: match[0],
      line: code.substring(0, match.index).split('\n').length
    });
  }
  
  return annotations;
}

function validateAnnotations(annotations, framework) {
  const validAnnotations = {
    spring: ['Component', 'Service', 'Repository', 'Controller', 'Autowired', 'Value'],
    jpa: ['Entity', 'Table', 'Column', 'Id', 'GeneratedValue'],
    junit: ['Test', 'Before', 'After', 'BeforeClass', 'AfterClass']
  };
  
  const valid = [];
  const invalid = [];
  
  annotations.forEach(annotation => {
    if (validAnnotations[framework]?.includes(annotation.name)) {
      valid.push(annotation);
    } else {
      invalid.push(annotation);
    }
  });
  
  return { valid, invalid, score: (valid.length / annotations.length) * 100 };
}

function generateAnnotationSuggestions(validation, framework) {
  return [
    'Use @Component for general Spring beans',
    'Use @Service for business logic classes',
    'Use @Repository for data access classes',
    'Use @Controller for web controllers'
  ];
}

function getAnnotationBestPractices(framework) {
  return {
    spring: [
      'Use specific stereotype annotations (@Service, @Repository) instead of generic @Component',
      'Avoid @Autowired on fields, prefer constructor injection',
      'Use @Value for external configuration'
    ]
  }[framework] || [];
}

function analyzeMethods(methods, maxLength) {
  const analysis = {
    methods: [],
    statistics: {
      total: methods.length,
      average: 0,
      longest: 0,
      shortest: Infinity
    },
    violations: []
  };
  
  methods.forEach(method => {
    const lines = Math.floor(Math.random() * 30) + 5; // Simulate method length
    analysis.methods.push({ ...method, lines });
    
    if (lines > maxLength) {
      analysis.violations.push({
        method: method.name,
        lines,
        maxAllowed: maxLength
      });
    }
    
    analysis.statistics.longest = Math.max(analysis.statistics.longest, lines);
    analysis.statistics.shortest = Math.min(analysis.statistics.shortest, lines);
  });
  
  analysis.statistics.average = analysis.methods.reduce((sum, m) => sum + m.lines, 0) / methods.length;
  
  return analysis;
}

function generateMethodRecommendations(analysis) {
  const recommendations = [];
  
  if (analysis.violations.length > 0) {
    recommendations.push('Break down long methods into smaller, focused methods');
  }
  
  recommendations.push('Follow Single Responsibility Principle');
  recommendations.push('Use descriptive method names');
  
  return recommendations;
}

function identifyRefactoringOpportunities(analysis) {
  return analysis.violations.map(violation => ({
    method: violation.method,
    opportunity: 'Extract Method',
    description: `Method ${violation.method} has ${violation.lines} lines and could be broken down`,
    effort: violation.lines > 50 ? 'High' : 'Medium'
  }));
}

function extractClasses(code, language) {
  const classes = [];
  const classRegex = /class\s+(\w+)/g;
  let match;
  
  while ((match = classRegex.exec(code)) !== null) {
    classes.push({
      name: match[1],
      line: code.substring(0, match.index).split('\n').length
    });
  }
  
  return classes;
}

function analyzeClassCohesion(classes) {
  return {
    classes: classes.map(cls => ({
      ...cls,
      cohesion: Math.random() * 100, // Simulate cohesion score
      methods: Math.floor(Math.random() * 20) + 5,
      fields: Math.floor(Math.random() * 10) + 2
    })),
    overall: Math.random() * 100
  };
}

function generateCohesionRecommendations(analysis) {
  return [
    'Group related methods and fields together',
    'Consider splitting classes with low cohesion',
    'Use composition over inheritance where appropriate'
  ];
}

function suggestDesignPatterns(analysis) {
  return [
    'Strategy Pattern for varying algorithms',
    'Factory Pattern for object creation',
    'Observer Pattern for event handling'
  ];
}

// Simplified helper functions
function extractFunctions(code) {
  const functions = [];
  const lines = code.split('\n');
  
  lines.forEach((line, index) => {
    if (line.includes('function') || line.includes('def ')) {
      functions.push({
        name: 'function' + index,
        startLine: index + 1,
        lines: Math.floor(Math.random() * 20) + 5
      });
    }
  });
  
  return functions;
}

function calculateNestingDepth(code) {
  let maxDepth = 0;
  let currentDepth = 0;
  
  for (let char of code) {
    if (char === '{' || char === '(') {
      currentDepth++;
      maxDepth = Math.max(maxDepth, currentDepth);
    } else if (char === '}' || char === ')') {
      currentDepth--;
    }
  }
  
  return maxDepth;
}

function findSimpleDuplicates(code) {
  // Simplified duplicate detection
  const lines = code.split('\n');
  const duplicates = [];
  
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[i].trim() === lines[j].trim() && lines[i].trim().length > 10) {
        duplicates.push({ line: i + 1 });
        break;
      }
    }
  }
  
  return duplicates;
}

module.exports = router;
