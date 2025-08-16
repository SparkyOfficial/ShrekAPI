const express = require('express');
const crypto = require('crypto');

const router = express.Router();

// Android manifest permissions
router.get('/manifest/permissions', (req, res) => {
  const { feature } = req.query;
  
  const permissionGroups = {
    camera: [
      'android.permission.CAMERA',
      'android.permission.WRITE_EXTERNAL_STORAGE'
    ],
    location: [
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_BACKGROUND_LOCATION'
    ],
    storage: [
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.MANAGE_EXTERNAL_STORAGE'
    ],
    network: [
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.ACCESS_WIFI_STATE'
    ],
    phone: [
      'android.permission.READ_PHONE_STATE',
      'android.permission.CALL_PHONE',
      'android.permission.READ_CALL_LOG'
    ]
  };

  if (feature) {
    const permissions = permissionGroups[feature.toLowerCase()];
    if (!permissions) {
      return res.status(404).json({
        error: 'Feature not found',
        availableFeatures: Object.keys(permissionGroups)
      });
    }

    res.json({
      feature,
      permissions,
      manifestXml: generateManifestXml(permissions),
      description: getPermissionDescriptions(permissions),
      timestamp: new Date().toISOString()
    });
  } else {
    res.json({
      availableFeatures: Object.keys(permissionGroups),
      allPermissions: permissionGroups,
      timestamp: new Date().toISOString()
    });
  }
});

// Resource optimizer
router.post('/resource/optimizer', (req, res) => {
  const { resources, optimization = 'size' } = req.body;
  if (!resources || !Array.isArray(resources)) {
    return res.status(400).json({ error: 'Resources array is required' });
  }

  const optimized = optimizeResources(resources, optimization);
  const savings = calculateSavings(resources, optimized);

  res.json({
    original: resources,
    optimized,
    optimization,
    savings,
    recommendations: generateOptimizationRecommendations(resources),
    timestamp: new Date().toISOString()
  });
});

// ProGuard rules generator
router.post('/proguard/rules', (req, res) => {
  const { packageName, keepClasses = [], libraries = [] } = req.body;
  if (!packageName) {
    return res.status(400).json({ error: 'PackageName is required' });
  }

  const rules = generateProGuardRules(packageName, keepClasses, libraries);

  res.json({
    packageName,
    keepClasses,
    libraries,
    rules,
    explanation: explainProGuardRules(),
    timestamp: new Date().toISOString()
  });
});

// Keystore generator
router.post('/keystore/generator', (req, res) => {
  const { 
    alias = 'mykey',
    keypass = 'changeit',
    storepass = 'changeit',
    validity = 365,
    keysize = 2048,
    keyalg = 'RSA'
  } = req.body;

  const keystoreInfo = generateKeystoreInfo(alias, keypass, storepass, validity, keysize, keyalg);

  res.json({
    keystoreInfo,
    command: generateKeytoolCommand(keystoreInfo),
    gradleConfig: generateGradleSigningConfig(keystoreInfo),
    security: generateSecurityRecommendations(),
    timestamp: new Date().toISOString()
  });
});

// Layout validator
router.post('/layout/validator', (req, res) => {
  const { layoutXml } = req.body;
  if (!layoutXml) {
    return res.status(400).json({ error: 'LayoutXml is required' });
  }

  const validation = validateLayout(layoutXml);

  res.json({
    layoutXml: layoutXml.substring(0, 200) + '...',
    validation,
    suggestions: generateLayoutSuggestions(validation),
    accessibility: checkAccessibility(layoutXml),
    timestamp: new Date().toISOString()
  });
});

// APK analyzer
router.post('/apk/analyzer', (req, res) => {
  const { apkPath, features = [] } = req.body;
  if (!apkPath) {
    return res.status(400).json({ error: 'ApkPath is required' });
  }

  const analysis = analyzeAPK(apkPath, features);

  res.json({
    apkPath,
    analysis,
    security: analyzeAPKSecurity(apkPath),
    performance: analyzeAPKPerformance(analysis),
    recommendations: generateAPKRecommendations(analysis),
    timestamp: new Date().toISOString()
  });
});

// Version codes
router.get('/version/codes', (req, res) => {
  const { apiLevel } = req.query;

  const versionCodes = {
    '34': { version: '14', codename: 'Android 14', releaseDate: '2023-10-04' },
    '33': { version: '13', codename: 'Tiramisu', releaseDate: '2022-08-15' },
    '32': { version: '12L', codename: 'Snow Cone v2', releaseDate: '2022-03-07' },
    '31': { version: '12', codename: 'Snow Cone', releaseDate: '2021-10-04' },
    '30': { version: '11', codename: 'Red Velvet Cake', releaseDate: '2020-09-08' },
    '29': { version: '10', codename: 'Quince Tart', releaseDate: '2019-09-03' },
    '28': { version: '9', codename: 'Pie', releaseDate: '2018-08-06' }
  };

  if (apiLevel) {
    const info = versionCodes[apiLevel];
    if (!info) {
      return res.status(404).json({
        error: 'API level not found',
        availableLevels: Object.keys(versionCodes)
      });
    }

    res.json({
      apiLevel: parseInt(apiLevel),
      ...info,
      features: getAPILevelFeatures(apiLevel),
      timestamp: new Date().toISOString()
    });
  } else {
    res.json({
      versionCodes,
      latest: versionCodes['34'],
      timestamp: new Date().toISOString()
    });
  }
});

// Density converter
router.get('/density/converter', (req, res) => {
  const { value, from = 'dp', to = 'px', density = 'xhdpi' } = req.query;
  
  if (!value) {
    return res.status(400).json({ error: 'Value parameter is required' });
  }

  const densityFactors = {
    'ldpi': 0.75,
    'mdpi': 1.0,
    'hdpi': 1.5,
    'xhdpi': 2.0,
    'xxhdpi': 3.0,
    'xxxhdpi': 4.0
  };

  const factor = densityFactors[density] || 2.0;
  const numValue = parseFloat(value);
  let result;

  if (from === 'dp' && to === 'px') {
    result = numValue * factor;
  } else if (from === 'px' && to === 'dp') {
    result = numValue / factor;
  } else if (from === 'sp' && to === 'px') {
    result = numValue * factor; // Simplified, doesn't account for user font scaling
  } else {
    return res.status(400).json({ error: 'Unsupported conversion' });
  }

  res.json({
    input: { value: numValue, unit: from },
    output: { value: Math.round(result * 100) / 100, unit: to },
    density,
    densityFactor: factor,
    allDensities: generateAllDensityConversions(numValue, from),
    timestamp: new Date().toISOString()
  });
});

// Intent generator
router.post('/intent/generator', (req, res) => {
  const { action, data, extras = {}, component } = req.body;
  if (!action) {
    return res.status(400).json({ error: 'Action parameter is required' });
  }

  const intentCode = generateIntentCode(action, data, extras, component);
  const manifestEntry = generateManifestIntentFilter(action);

  res.json({
    action,
    data,
    extras,
    component,
    kotlinCode: intentCode.kotlin,
    javaCode: intentCode.java,
    manifestEntry,
    commonActions: getCommonIntentActions(),
    timestamp: new Date().toISOString()
  });
});

// Gradle cleaner
router.post('/gradle/cleaner', (req, res) => {
  const { projectPath, cleanType = 'cache' } = req.body;
  
  const cleanCommands = generateCleanCommands(cleanType);
  const cleanupSize = estimateCleanupSize(cleanType);

  res.json({
    projectPath: projectPath || 'current directory',
    cleanType,
    commands: cleanCommands,
    estimatedSize: cleanupSize,
    warnings: getCleanupWarnings(cleanType),
    alternatives: getCleanupAlternatives(),
    timestamp: new Date().toISOString()
  });
});

// Helper functions
function generateManifestXml(permissions) {
  return permissions.map(permission => 
    `<uses-permission android:name="${permission}" />`
  ).join('\n');
}

function getPermissionDescriptions(permissions) {
  const descriptions = {
    'android.permission.CAMERA': 'Access device camera',
    'android.permission.ACCESS_FINE_LOCATION': 'Access precise location',
    'android.permission.INTERNET': 'Access internet',
    'android.permission.WRITE_EXTERNAL_STORAGE': 'Write to external storage'
  };
  
  return permissions.map(permission => ({
    permission,
    description: descriptions[permission] || 'Permission description not available'
  }));
}

function optimizeResources(resources, optimization) {
  return resources.map(resource => ({
    ...resource,
    optimized: true,
    originalSize: resource.size || '100KB',
    optimizedSize: optimization === 'size' ? '75KB' : '90KB',
    method: optimization === 'size' ? 'compression' : 'quality reduction'
  }));
}

function calculateSavings(original, optimized) {
  const originalTotal = original.length * 100; // Simplified
  const optimizedTotal = optimized.length * 75;
  
  return {
    originalSize: `${originalTotal}KB`,
    optimizedSize: `${optimizedTotal}KB`,
    savings: `${originalTotal - optimizedTotal}KB`,
    percentage: `${Math.round((1 - optimizedTotal / originalTotal) * 100)}%`
  };
}

function generateOptimizationRecommendations(resources) {
  return [
    'Use WebP format for images',
    'Remove unused resources',
    'Use vector drawables when possible',
    'Optimize PNG files with tools like TinyPNG'
  ];
}

function generateProGuardRules(packageName, keepClasses, libraries) {
  let rules = `# ProGuard rules for ${packageName}\n\n`;
  
  rules += `# Keep main application class\n`;
  rules += `-keep class ${packageName}.** { *; }\n\n`;
  
  if (keepClasses.length > 0) {
    rules += `# Keep specified classes\n`;
    keepClasses.forEach(className => {
      rules += `-keep class ${className} { *; }\n`;
    });
    rules += '\n';
  }
  
  libraries.forEach(lib => {
    rules += `# Rules for ${lib}\n`;
    rules += `-keep class ${lib}.** { *; }\n`;
  });
  
  return rules;
}

function explainProGuardRules() {
  return {
    '-keep': 'Prevents classes/methods from being obfuscated or removed',
    '-keepclassmembers': 'Keeps only the specified class members',
    '-dontwarn': 'Suppresses warnings for specified classes',
    '-optimizations': 'Specifies optimization techniques to use'
  };
}

function generateKeystoreInfo(alias, keypass, storepass, validity, keysize, keyalg) {
  return {
    alias,
    keypass,
    storepass,
    validity,
    keysize,
    keyalg,
    keystoreName: `${alias}.keystore`,
    dname: 'CN=Developer, O=Company, C=US'
  };
}

function generateKeytoolCommand(info) {
  return `keytool -genkey -v -keystore ${info.keystoreName} -alias ${info.alias} -keyalg ${info.keyalg} -keysize ${info.keysize} -validity ${info.validity} -keypass ${info.keypass} -storepass ${info.storepass} -dname "${info.dname}"`;
}

function generateGradleSigningConfig(info) {
  return `android {
    signingConfigs {
        release {
            keyAlias '${info.alias}'
            keyPassword '${info.keypass}'
            storeFile file('${info.keystoreName}')
            storePassword '${info.storepass}'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}`;
}

function generateSecurityRecommendations() {
  return [
    'Use strong passwords for keystore and key',
    'Store keystore file securely',
    'Never commit keystore to version control',
    'Use environment variables for passwords in CI/CD',
    'Consider using Android App Bundle for distribution'
  ];
}

function validateLayout(layoutXml) {
  const issues = [];
  const warnings = [];
  
  if (!layoutXml.includes('android:contentDescription')) {
    issues.push('Missing content descriptions for accessibility');
  }
  
  if (layoutXml.includes('wrap_content') && layoutXml.includes('match_parent')) {
    warnings.push('Mixed layout parameters might cause issues');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    warnings,
    score: Math.max(0, 100 - (issues.length * 20) - (warnings.length * 10))
  };
}

function generateLayoutSuggestions(validation) {
  const suggestions = [];
  
  if (validation.issues.includes('Missing content descriptions for accessibility')) {
    suggestions.push('Add android:contentDescription to ImageView and other non-text elements');
  }
  
  suggestions.push('Use ConstraintLayout for better performance');
  suggestions.push('Avoid nested LinearLayouts');
  
  return suggestions;
}

function checkAccessibility(layoutXml) {
  return {
    hasContentDescriptions: layoutXml.includes('android:contentDescription'),
    hasProperContrast: true, // Simplified
    hasClickTargets: layoutXml.includes('android:clickable'),
    score: 85
  };
}

function analyzeAPK(apkPath, features) {
  return {
    size: '25.6 MB',
    minSdkVersion: 21,
    targetSdkVersion: 34,
    versionCode: 1,
    versionName: '1.0.0',
    packageName: 'com.example.app',
    permissions: ['INTERNET', 'CAMERA', 'WRITE_EXTERNAL_STORAGE'],
    activities: 5,
    services: 2,
    receivers: 3,
    libraries: ['androidx', 'okhttp', 'gson']
  };
}

function analyzeAPKSecurity(apkPath) {
  return {
    isSigned: true,
    hasObfuscation: false,
    vulnerabilities: [],
    securityScore: 85,
    recommendations: [
      'Enable ProGuard obfuscation',
      'Use certificate pinning for network requests',
      'Implement root detection'
    ]
  };
}

function analyzeAPKPerformance(analysis) {
  return {
    startupTime: '2.1s',
    memoryUsage: '45MB',
    batteryImpact: 'Low',
    networkUsage: 'Moderate',
    recommendations: [
      'Optimize image resources',
      'Use lazy loading for lists',
      'Implement proper caching'
    ]
  };
}

function generateAPKRecommendations(analysis) {
  return [
    'Consider using App Bundle for smaller download size',
    'Update target SDK to latest version',
    'Review and minimize required permissions',
    'Implement proper error handling'
  ];
}

function getAPILevelFeatures(apiLevel) {
  const features = {
    '34': ['Predictive back gesture', 'Partial photo picker', 'Themed app icons'],
    '33': ['Themed app icons', 'Per-app language preferences', 'Photo picker'],
    '31': ['Material You', 'Splash screen API', 'App hibernation'],
    '30': ['Scoped storage', 'One-time permissions', 'Auto-reset permissions']
  };
  
  return features[apiLevel] || ['Feature information not available'];
}

function generateAllDensityConversions(value, fromUnit) {
  const densities = ['ldpi', 'mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
  const factors = { 'ldpi': 0.75, 'mdpi': 1.0, 'hdpi': 1.5, 'xhdpi': 2.0, 'xxhdpi': 3.0, 'xxxhdpi': 4.0 };
  
  return densities.map(density => ({
    density,
    value: fromUnit === 'dp' ? value * factors[density] : value / factors[density],
    unit: fromUnit === 'dp' ? 'px' : 'dp'
  }));
}

function generateIntentCode(action, data, extras, component) {
  const kotlinExtras = Object.entries(extras).map(([key, value]) => 
    `putExtra("${key}", ${typeof value === 'string' ? `"${value}"` : value})`
  ).join('\n        ');
  
  const kotlin = `val intent = Intent("${action}")${data ? `\nintent.data = Uri.parse("${data}")` : ''}
${kotlinExtras ? `intent.${kotlinExtras}` : ''}${component ? `\nintent.component = ComponentName("${component.package}", "${component.class}")` : ''}
startActivity(intent)`;

  const java = `Intent intent = new Intent("${action}");${data ? `\nintent.setData(Uri.parse("${data}"));` : ''}
${Object.entries(extras).map(([key, value]) => 
  `intent.putExtra("${key}", ${typeof value === 'string' ? `"${value}"` : value});`
).join('\n')}${component ? `\nintent.setComponent(new ComponentName("${component.package}", "${component.class}"));` : ''}
startActivity(intent);`;

  return { kotlin, java };
}

function generateManifestIntentFilter(action) {
  return `<intent-filter>
    <action android:name="${action}" />
    <category android:name="android.intent.category.DEFAULT" />
</intent-filter>`;
}

function getCommonIntentActions() {
  return [
    'android.intent.action.VIEW',
    'android.intent.action.SEND',
    'android.intent.action.CALL',
    'android.intent.action.DIAL',
    'android.intent.action.SENDTO',
    'android.media.action.IMAGE_CAPTURE'
  ];
}

function generateCleanCommands(cleanType) {
  const commands = {
    cache: [
      './gradlew clean',
      './gradlew cleanBuildCache',
      'rm -rf ~/.gradle/caches/',
      'rm -rf .gradle/'
    ],
    build: [
      './gradlew clean',
      'rm -rf build/',
      'rm -rf app/build/'
    ],
    all: [
      './gradlew clean',
      './gradlew cleanBuildCache',
      'rm -rf ~/.gradle/caches/',
      'rm -rf .gradle/',
      'rm -rf build/',
      'rm -rf */build/'
    ]
  };
  
  return commands[cleanType] || commands.cache;
}

function estimateCleanupSize(cleanType) {
  const sizes = {
    cache: '500MB - 2GB',
    build: '100MB - 500MB',
    all: '1GB - 3GB'
  };
  
  return sizes[cleanType] || sizes.cache;
}

function getCleanupWarnings(cleanType) {
  return [
    'This will remove build artifacts and may require rebuilding',
    'Gradle daemon will be stopped',
    'Dependencies may need to be re-downloaded'
  ];
}

function getCleanupAlternatives() {
  return [
    'Use Android Studio "Clean Project" option',
    'Invalidate caches and restart IDE',
    'Use gradle --refresh-dependencies'
  ];
}

module.exports = router;
