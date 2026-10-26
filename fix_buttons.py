import re

with open('src/components/CalculationHistory.tsx', 'r') as f:
    content = f.read()

# Find the weird button and replace it properly
pattern = r'<button\s*onClick=\{\(\) => setExpandedId\(isExpanded \? null : session\.id\)\}\s*className="p-1\.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"\s*title="Export session as JSON" onClick=\{\(\) => exportSingleSession\(session\)\}> <Download className="w-4 h-4" \/><\/button> <button onClick=\{\(\) => setExpandedId\(isExpanded \? null : session\.id\)\} className="p-1\.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title=\{isExpanded \? '"'Hide details'"' : '"'View session details'"'\}'

replacement = """<button
                      onClick={() => exportSingleSession(session)}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title="Export session as JSON"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : session.id)}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title={isExpanded ? 'Hide details' : 'View session details'}"""

new_content = re.sub(pattern, replacement, content, flags=re.MULTILINE)

with open('src/components/CalculationHistory.tsx', 'w') as f:
    f.write(new_content)
