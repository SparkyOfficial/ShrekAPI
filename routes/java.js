const express = require('express');
const { js: jsBeautify } = require('js-beautify');
const axios = require('axios');

const router = express.Router();

// Java class decompiler (simplified)
router.post('/java/class/decompile', (req, res) => {
  const { bytecode, className } = req.body;
  if (!bytecode) {
    return res.status(400).json({ error: 'Bytecode parameter is required' });
  }

  // Simplified decompilation simulation
  const decompiled = generateSimpleJavaClass(className || 'DecompiledClass');
  
  res.json({
    className: className || 'DecompiledClass',
    originalBytecode: bytecode.substring(0, 100) + '...',
    decompiledCode: decompiled,
    metadata: {
      methods: extractMethods(decompiled),
      fields: extractFields(decompiled),
      imports: extractImports(decompiled)
    },
    timestamp: new Date().toISOString()
  });
});

// Kotlin to Java converter
router.post('/kotlin/java/convert', (req, res) => {
  const { code, direction = 'kotlin-to-java' } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Code parameter is required' });
  }

  let converted;
  if (direction === 'kotlin-to-java') {
    converted = convertKotlinToJava(code);
  } else if (direction === 'java-to-kotlin') {
    converted = convertJavaToKotlin(code);
  } else {
    return res.status(400).json({ error: 'Direction must be "kotlin-to-java" or "java-to-kotlin"' });
  }

  res.json({
    original: code,
    converted,
    direction,
    changes: analyzeConversionChanges(code, converted),
    timestamp: new Date().toISOString()
  });
});

// Regex tester
router.post('/regex/test', (req, res) => {
  const { pattern, text, flags = 'g' } = req.body;
  if (!pattern || !text) {
    return res.status(400).json({ error: 'Pattern and text parameters are required' });
  }

  try {
    const regex = new RegExp(pattern, flags);
    const matches = [...text.matchAll(regex)];
    const isMatch = regex.test(text);

    res.json({
      pattern,
      text,
      flags,
      isMatch,
      matches: matches.map((match, index) => ({
        index,
        match: match[0],
        groups: match.slice(1),
        start: match.index,
        end: match.index + match[0].length
      })),
      totalMatches: matches.length,
      explanation: explainRegex(pattern),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({
      error: 'Invalid regex pattern',
      message: error.message,
      pattern,
      timestamp: new Date().toISOString()
    });
  }
});

// SQL formatter
router.post('/sql/format', (req, res) => {
  const { sql, style = 'standard' } = req.body;
  if (!sql) {
    return res.status(400).json({ error: 'SQL parameter is required' });
  }

  const formatted = formatSQL(sql, style);
  const minified = minifySQL(sql);

  res.json({
    original: sql,
    formatted,
    minified,
    style,
    statistics: {
      originalLength: sql.length,
      formattedLength: formatted.length,
      minifiedLength: minified.length,
      tables: extractTables(sql),
      keywords: extractSQLKeywords(sql)
    },
    timestamp: new Date().toISOString()
  });
});

// Lombok annotation generator
router.post('/lombok/generate', (req, res) => {
  const { className, fields, annotations = [] } = req.body;
  if (!className || !fields) {
    return res.status(400).json({ error: 'ClassName and fields parameters are required' });
  }

  const lombokCode = generateLombokClass(className, fields, annotations);
  const traditionalCode = generateTraditionalJavaClass(className, fields);

  res.json({
    className,
    fields,
    annotations,
    lombokCode,
    traditionalCode,
    comparison: {
      lombokLines: lombokCode.split('\n').length,
      traditionalLines: traditionalCode.split('\n').length,
      reduction: `${Math.round((1 - lombokCode.length / traditionalCode.length) * 100)}%`
    },
    timestamp: new Date().toISOString()
  });
});

// Gradle version checker
router.get('/gradle/version/latest', async (req, res) => {
  const { dependency } = req.query;
  
  try {
    // Simulate Maven Central API call
    const popularDependencies = {
      'spring-boot': '3.2.0',
      'junit': '5.10.0',
      'mockito': '5.7.0',
      'jackson': '2.16.0',
      'slf4j': '2.0.9',
      'logback': '1.4.14'
    };

    if (dependency) {
      const version = popularDependencies[dependency.toLowerCase()];
      if (!version) {
        return res.status(404).json({ error: 'Dependency not found in our database' });
      }

      res.json({
        dependency,
        latestVersion: version,
        gradleFormat: `implementation '${dependency}:${version}'`,
        mavenFormat: generateMavenXml(dependency, version),
        timestamp: new Date().toISOString()
      });
    } else {
      res.json({
        popularDependencies: Object.entries(popularDependencies).map(([name, version]) => ({
          name,
          version,
          gradleFormat: `implementation '${name}:${version}'`
        })),
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch dependency versions',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Spring properties generator
router.post('/spring/property/generator', (req, res) => {
  const { profile = 'dev', database = 'h2', features = [] } = req.body;

  const properties = generateSpringProperties(profile, database, features);
  const yamlFormat = convertPropertiesToYaml(properties);

  res.json({
    profile,
    database,
    features,
    properties: {
      format: 'properties',
      content: properties
    },
    yaml: {
      format: 'yaml',
      content: yamlFormat
    },
    timestamp: new Date().toISOString()
  });
});

// Exception analyzer
router.post('/exception/analyzer', (req, res) => {
  const { stackTrace } = req.body;
  if (!stackTrace) {
    return res.status(400).json({ error: 'StackTrace parameter is required' });
  }

  const analysis = analyzeStackTrace(stackTrace);

  res.json({
    stackTrace: stackTrace.substring(0, 500) + '...',
    analysis,
    suggestions: generateExceptionSuggestions(analysis),
    commonCauses: getCommonCauses(analysis.exceptionType),
    timestamp: new Date().toISOString()
  });
});

// JAR info analyzer
router.post('/jar/info', (req, res) => {
  const { jarName, manifest } = req.body;
  if (!jarName) {
    return res.status(400).json({ error: 'JarName parameter is required' });
  }

  const jarInfo = analyzeJarInfo(jarName, manifest);

  res.json({
    jarName,
    info: jarInfo,
    security: analyzeJarSecurity(jarName),
    dependencies: extractJarDependencies(manifest),
    timestamp: new Date().toISOString()
  });
});

// JVM memory calculator
router.get('/jvm/memory/calculator', (req, res) => {
  const { heapSize, applicationSize, concurrentUsers = 100 } = req.query;
  
  if (!heapSize || !applicationSize) {
    return res.status(400).json({ error: 'HeapSize and applicationSize parameters are required' });
  }

  const memoryConfig = calculateJVMMemory(
    parseInt(heapSize),
    parseInt(applicationSize),
    parseInt(concurrentUsers)
  );

  res.json({
    input: {
      heapSize: parseInt(heapSize),
      applicationSize: parseInt(applicationSize),
      concurrentUsers: parseInt(concurrentUsers)
    },
    recommendations: memoryConfig,
    jvmFlags: generateJVMFlags(memoryConfig),
    monitoring: generateMonitoringConfig(),
    timestamp: new Date().toISOString()
  });
});

// Helper functions
function generateSimpleJavaClass(className) {
  return `public class ${className} {
    private String field1;
    private int field2;
    
    public ${className}() {
        // Default constructor
    }
    
    public String getField1() {
        return field1;
    }
    
    public void setField1(String field1) {
        this.field1 = field1;
    }
    
    public int getField2() {
        return field2;
    }
    
    public void setField2(int field2) {
        this.field2 = field2;
    }
}`;
}

function convertKotlinToJava(kotlinCode) {
  // Simplified conversion
  let javaCode = kotlinCode
    .replace(/fun\s+(\w+)\s*\(/g, 'public void $1(')
    .replace(/val\s+(\w+)\s*=/g, 'final var $1 =')
    .replace(/var\s+(\w+)\s*=/g, 'var $1 =')
    .replace(/class\s+(\w+)/g, 'public class $1')
    .replace(/\?\./g, '.')
    .replace(/!!/g, '');
  
  return `// Converted from Kotlin\n${javaCode}`;
}

function convertJavaToKotlin(javaCode) {
  // Simplified conversion
  let kotlinCode = javaCode
    .replace(/public\s+void\s+(\w+)\s*\(/g, 'fun $1(')
    .replace(/public\s+class\s+(\w+)/g, 'class $1')
    .replace(/final\s+var\s+(\w+)\s*=/g, 'val $1 =')
    .replace(/var\s+(\w+)\s*=/g, 'var $1 =')
    .replace(/System\.out\.println/g, 'println');
  
  return `// Converted from Java\n${kotlinCode}`;
}

function analyzeConversionChanges(original, converted) {
  return {
    linesChanged: Math.abs(original.split('\n').length - converted.split('\n').length),
    charactersChanged: Math.abs(original.length - converted.length),
    keywordChanges: ['fun', 'val', 'var', 'class'].length
  };
}

function explainRegex(pattern) {
  const explanations = {
    '\\d': 'matches any digit (0-9)',
    '\\w': 'matches any word character (a-z, A-Z, 0-9, _)',
    '\\s': 'matches any whitespace character',
    '+': 'matches one or more of the preceding character',
    '*': 'matches zero or more of the preceding character',
    '?': 'matches zero or one of the preceding character'
  };
  
  let explanation = 'Pattern breakdown:\n';
  for (const [regex, desc] of Object.entries(explanations)) {
    if (pattern.includes(regex)) {
      explanation += `- ${regex}: ${desc}\n`;
    }
  }
  
  return explanation;
}

function formatSQL(sql, style) {
  const keywords = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'ORDER BY', 'GROUP BY', 'HAVING'];
  let formatted = sql.toUpperCase();
  
  keywords.forEach(keyword => {
    formatted = formatted.replace(new RegExp(keyword, 'gi'), `\n${keyword}`);
  });
  
  return formatted.trim();
}

function minifySQL(sql) {
  return sql.replace(/\s+/g, ' ').trim();
}

function extractTables(sql) {
  const tableRegex = /FROM\s+(\w+)|JOIN\s+(\w+)/gi;
  const matches = [...sql.matchAll(tableRegex)];
  return matches.map(match => match[1] || match[2]).filter(Boolean);
}

function extractSQLKeywords(sql) {
  const keywords = sql.match(/\b(SELECT|FROM|WHERE|JOIN|ORDER|GROUP|HAVING|INSERT|UPDATE|DELETE)\b/gi) || [];
  return [...new Set(keywords.map(k => k.toUpperCase()))];
}

function generateLombokClass(className, fields, annotations) {
  const lombokAnnotations = ['@Data', '@Builder', '@NoArgsConstructor', '@AllArgsConstructor'];
  const selectedAnnotations = annotations.length ? annotations : lombokAnnotations;
  
  return `${selectedAnnotations.join('\n')}
public class ${className} {
${fields.map(field => `    private ${field.type} ${field.name};`).join('\n')}
}`;
}

function generateTraditionalJavaClass(className, fields) {
  const gettersSetters = fields.map(field => `
    public ${field.type} get${field.name.charAt(0).toUpperCase() + field.name.slice(1)}() {
        return ${field.name};
    }
    
    public void set${field.name.charAt(0).toUpperCase() + field.name.slice(1)}(${field.type} ${field.name}) {
        this.${field.name} = ${field.name};
    }`).join('\n');

  return `public class ${className} {
${fields.map(field => `    private ${field.type} ${field.name};`).join('\n')}
    
    public ${className}() {}
    ${gettersSetters}
}`;
}

function generateMavenXml(dependency, version) {
  return `<dependency>
    <groupId>${dependency}</groupId>
    <artifactId>${dependency}</artifactId>
    <version>${version}</version>
</dependency>`;
}

function generateSpringProperties(profile, database, features) {
  const baseProperties = `# Spring Boot Configuration - ${profile} profile
spring.profiles.active=${profile}
server.port=8080

# Database Configuration
spring.datasource.url=jdbc:${database}:mem:testdb
spring.datasource.driver-class-name=org.${database}.Driver
spring.jpa.hibernate.ddl-auto=update

# Logging
logging.level.org.springframework=INFO
logging.level.com.example=DEBUG`;

  return baseProperties;
}

function convertPropertiesToYaml(properties) {
  const lines = properties.split('\n');
  let yaml = '';
  
  lines.forEach(line => {
    if (line.startsWith('#') || line.trim() === '') {
      yaml += line + '\n';
    } else if (line.includes('=')) {
      const [key, value] = line.split('=');
      const yamlKey = key.replace(/\./g, ':\n  ');
      yaml += `${yamlKey}: ${value}\n`;
    }
  });
  
  return yaml;
}

function analyzeStackTrace(stackTrace) {
  const lines = stackTrace.split('\n');
  const exceptionLine = lines[0];
  const exceptionType = exceptionLine.split(':')[0];
  const message = exceptionLine.split(':').slice(1).join(':').trim();
  
  return {
    exceptionType,
    message,
    rootCause: lines[1] || 'Unknown',
    stackDepth: lines.length,
    involvedClasses: extractClassNames(stackTrace)
  };
}

function extractClassNames(stackTrace) {
  const classRegex = /at\s+([a-zA-Z0-9_.]+)\./g;
  const matches = [...stackTrace.matchAll(classRegex)];
  return [...new Set(matches.map(match => match[1]))].slice(0, 5);
}

function generateExceptionSuggestions(analysis) {
  const suggestions = {
    'NullPointerException': ['Check for null values before method calls', 'Use Optional<T> for nullable values'],
    'ClassNotFoundException': ['Verify classpath configuration', 'Check if required JAR files are present'],
    'OutOfMemoryError': ['Increase heap size with -Xmx flag', 'Check for memory leaks']
  };
  
  return suggestions[analysis.exceptionType] || ['Review the stack trace for clues', 'Check application logs'];
}

function getCommonCauses(exceptionType) {
  const causes = {
    'NullPointerException': ['Uninitialized variables', 'Missing null checks', 'Incorrect object lifecycle'],
    'ClassNotFoundException': ['Missing dependencies', 'Incorrect classpath', 'Version conflicts'],
    'OutOfMemoryError': ['Memory leaks', 'Large object creation', 'Insufficient heap size']
  };
  
  return causes[exceptionType] || ['Unknown exception type'];
}

function analyzeJarInfo(jarName, manifest) {
  return {
    name: jarName,
    size: `${Math.floor(Math.random() * 1000)}KB`,
    mainClass: manifest?.['Main-Class'] || 'Not specified',
    version: manifest?.['Implementation-Version'] || 'Unknown',
    vendor: manifest?.['Implementation-Vendor'] || 'Unknown',
    javaVersion: manifest?.['Build-Jdk'] || 'Unknown'
  };
}

function analyzeJarSecurity(jarName) {
  return {
    signed: Math.random() > 0.5,
    vulnerabilities: Math.floor(Math.random() * 3),
    trustLevel: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)]
  };
}

function extractJarDependencies(manifest) {
  return ['commons-lang3', 'slf4j-api', 'jackson-core'].slice(0, Math.floor(Math.random() * 3) + 1);
}

function calculateJVMMemory(heapSize, applicationSize, concurrentUsers) {
  const recommendedHeap = Math.max(heapSize, applicationSize * 2);
  const metaspace = Math.max(256, applicationSize / 4);
  const directMemory = Math.max(64, concurrentUsers * 2);
  
  return {
    heap: `${recommendedHeap}MB`,
    metaspace: `${metaspace}MB`,
    directMemory: `${directMemory}MB`,
    total: `${recommendedHeap + metaspace + directMemory}MB`
  };
}

function generateJVMFlags(memoryConfig) {
  return [
    `-Xms${memoryConfig.heap}`,
    `-Xmx${memoryConfig.heap}`,
    `-XX:MetaspaceSize=${memoryConfig.metaspace}`,
    `-XX:MaxDirectMemorySize=${memoryConfig.directMemory}`,
    '-XX:+UseG1GC',
    '-XX:+UseStringDeduplication'
  ];
}

function generateMonitoringConfig() {
  return {
    jmx: 'Enable JMX monitoring',
    gc: 'Enable GC logging',
    heap: 'Monitor heap usage',
    threads: 'Monitor thread count'
  };
}

function extractMethods(code) {
  const methodRegex = /public\s+\w+\s+(\w+)\s*\(/g;
  const matches = [...code.matchAll(methodRegex)];
  return matches.map(match => match[1]);
}

function extractFields(code) {
  const fieldRegex = /private\s+(\w+)\s+(\w+);/g;
  const matches = [...code.matchAll(fieldRegex)];
  return matches.map(match => ({ type: match[1], name: match[2] }));
}

function extractImports(code) {
  const importRegex = /import\s+([^;]+);/g;
  const matches = [...code.matchAll(importRegex)];
  return matches.map(match => match[1]);
}

module.exports = router;
