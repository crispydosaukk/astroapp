const fs = require('fs');
const path = 'src/features/matchKundli/MatchKundliScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add imports
content = content.replace(
  "import { AppRoutes, push } from '@/navigation/routes';",
  "import { AppRoutes, push } from '@/navigation/routes';\nimport { generateKundliMatchReport } from '@/services/reportService';\nimport { showSnackBar } from '@/components/overlays';"
);

// 2. Add isGeneratingReport state
content = content.replace(
  "const [isCalculating, setIsCalculating] = useState(false);",
  "const [isCalculating, setIsCalculating] = useState(false);\n  const [isGeneratingReport, setIsGeneratingReport] = useState(false);\n  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);"
);

// 3. Replace report button with genuine report generation
content = content.replace(
  `              <ElevatedButton
                testID="matchKundli.detailedReport"
                label="Get Detailed Compatibility Report — ₹399"
                onPress={() => {
                  push(AppRoutes.aiChatScreen, {
                    astrologerId: 'vedika',
                    initialPrompt: \`Namaste, I need the full detailed marriage compatibility report for \${p1} and \${p2} (Score: \${score}/36). Please analyze all 8 Kutas, dosha cancellations, and remedies.\`
                  });
                }}
                bg="#713B32"
                fg="#FFFFFF"
                radius={100}
                paddingV={14}
                paddingH={12}
                fontSize={14}
                fontWeight="700"
              />`,
  `              <ElevatedButton
                testID="matchKundli.detailedReport"
                label={isGeneratingReport ? "Generating Report..." : "Generate Detailed Compatibility Report"}
                icon={isGeneratingReport ? undefined : "description_outlined"}
                disabled={isGeneratingReport}
                onPress={async () => {
                  const isUserLoggedIn = Boolean(isAuthenticated && authUser && (authUser.uid || authUser.phone));
                  if (!isUserLoggedIn) {
                    showSnackBar('Please sign in to generate compatibility report', '#713B32');
                    push(AppRoutes.signInScreen);
                    return;
                  }
                  try {
                    setIsGeneratingReport(true);
                    showSnackBar(\`Generating detailed compatibility report for \${p1} & \${p2}...\`, colors.surfaceVariant);
                    await generateKundliMatchReport({
                      groom: { name: p1, dob: p1Dob, tob: p1Tob, pob: p1Pob },
                      bride: { name: p2 },
                      score,
                      verdict: verdictTitle,
                      ashtakoot: gunas,
                    });
                    showSnackBar(\`Kundli Compatibility Report generated successfully!\`, colors.surfaceVariant);
                    push(AppRoutes.kundliReportsScreen);
                  } catch (err: any) {
                    showSnackBar(err.message || 'Failed to generate report', '#CF4444');
                  } finally {
                    setIsGeneratingReport(false);
                  }
                }}
                bg="#713B32"
                fg="#FFFFFF"
                radius={100}
                paddingV={14}
                paddingH={12}
                fontSize={14}
                fontWeight="700"
              />`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated MatchKundliScreen.tsx');

