'use client';

import React, { useState, useMemo } from 'react';
import {
  Globe,
  Search,
  ExternalLink,
  Shield,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Code2,
  FileCode,
  Layers,
  ChevronRight,
  RefreshCw,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { WhitelistedResource } from '@/lib/practicalBank';

interface WhitelistedDocsBrowserProps {
  allowedResources: WhitelistedResource[];
  subjectCode?: string;
}

// Built-in offline technical cheat sheets for essential syntax
const BUILTIN_DOCS: Record<string, { title: string; category: string; content: string }> = {
  'html-forms': {
    title: 'HTML5 Form Elements & Attributes',
    category: 'HTML',
    content: `<!-- Accessible HTML5 Form Syntax -->
<form id="studentForm" novalidate>
  <div class="form-group">
    <label for="fullName">Full Name</label>
    <input 
      type="text" 
      id="fullName" 
      name="fullName" 
      required 
      minlength="3" 
      placeholder="e.g. Alex Johnson"
    />
    <span class="error-msg" id="nameError"></span>
  </div>

  <div class="form-group">
    <label for="rollNo">Roll Number</label>
    <input 
      type="text" 
      id="rollNo" 
      pattern="^202[0-9]-[A-Z]{2}-[0-9]{3}$" 
      required
    />
  </div>

  <button type="submit">Submit Registration</button>
</form>`,
  },
  'css-flex-grid': {
    title: 'CSS Flexbox & Responsive Grid Layouts',
    category: 'CSS',
    content: `/* Flexbox Container */
.flex-container {
  display: flex;
  justify-content: space-between; /* flex-start | center | space-between */
  align-items: center;            /* stretch | flex-start | center */
  gap: 16px;
  flex-wrap: wrap;
}

/* Responsive CSS Grid */
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

/* Mobile Media Query */
@media (max-width: 640px) {
  .flex-container {
    flex-direction: column;
    align-items: stretch;
  }
}`,
  },
  'js-dom-events': {
    title: 'JavaScript DOM & Form Validation APIs',
    category: 'JAVASCRIPT',
    content: `// Form Submit & Event Prevention
const form = document.getElementById('studentForm');

form.addEventListener('submit', (event) => {
  event.preventDefault(); // Stop page reload

  const nameInput = document.getElementById('fullName');
  const rollInput = document.getElementById('rollNo');
  
  // Custom Validation Logic
  if (nameInput.value.trim().length < 3) {
    showError(nameInput, 'Name must contain at least 3 characters.');
    return;
  }

  // Construct JSON Object
  const studentData = {
    fullName: nameInput.value.trim(),
    rollNumber: rollInput.value.trim(),
    submittedAt: new Date().toISOString()
  };

  console.log('Valid Submission Payload:', studentData);
});

// Dynamic Card Rendering
function renderCard(data) {
  const container = document.getElementById('cardOutput');
  const card = document.createElement('div');
  card.className = 'summary-card';
  card.innerHTML = '<h3>' + data.fullName + '</h3><p>' + data.rollNumber + '</p>';
  container.appendChild(card);
}`,
  },
  'sql-queries': {
    title: 'Standard SQL Joins, Aggregations & Views',
    category: 'SQL',
    content: `-- 1. Inner Join with Filter
SELECT s.student_id, s.name, e.grade_points
FROM students s
INNER JOIN enrollments e ON s.student_id = e.student_id
INNER JOIN courses c ON e.course_id = c.course_id
WHERE c.course_name = 'Advanced Operating Systems';

-- 2. Group By with Having
SELECT department_id, COUNT(*) AS prof_count, AVG(salary) AS avg_salary
FROM professors
GROUP BY department_id
HAVING COUNT(*) > 3 AND AVG(salary) > 80000;

-- 3. Window Function (Ranking)
SELECT student_id, department_id, gpa,
  DENSE_RANK() OVER (PARTITION BY department_id ORDER BY gpa DESC) as rank_in_dept
FROM students;

-- 4. Create View
CREATE VIEW V_DepartmentMetrics AS
SELECT d.dept_name, COUNT(s.student_id) as total_students, AVG(s.gpa) as avg_gpa
FROM departments d
LEFT JOIN students s ON d.dept_id = s.dept_id
GROUP BY d.dept_name;`,
  },
  'python-dsa': {
    title: 'Python Binary Search Tree & Recursion Reference',
    category: 'PYTHON',
    content: `# BST Node Definition
class Node:
    def __init__(self, key):
        self.key = key
        self.left = None
        self.right = None

# Recursive Insert
def insert(root, key):
    if root is None:
        return Node(key)
    if key < root.key:
        root.left = insert(root.left, key)
    elif key > root.key:
        root.right = insert(root.right, key)
    return root

# Inorder Traversal (Sorted)
def inorder(root, result=None):
    if result is None:
        result = []
    if root:
        inorder(root.left, result)
        result.append(root.key)
        inorder(root.right, result)
    return result

# Calculate Height
def get_height(root):
    if root is None:
        return 0
    return 1 + max(get_height(root.left), get_height(root.right))`,
  },
};

export default function WhitelistedDocsBrowser({
  allowedResources,
  subjectCode,
}: WhitelistedDocsBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocKey, setSelectedDocKey] = useState<string>('html-forms');
  const [activeTab, setActiveTab] = useState<'CHEAT_SHEETS' | 'EXTERNAL_RESOURCES'>('CHEAT_SHEETS');
  const [activeExternalUrl, setActiveExternalUrl] = useState<string | null>(null);

  // Filtered Cheatsheets
  const filteredCheatSheets = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return Object.entries(BUILTIN_DOCS);
    return Object.entries(BUILTIN_DOCS).filter(([_, doc]) => {
      return (
        doc.title.toLowerCase().includes(q) ||
        doc.category.toLowerCase().includes(q) ||
        doc.content.toLowerCase().includes(q)
      );
    });
  }, [searchQuery]);

  // Filtered External Resources
  const filteredResources = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allowedResources;
    return allowedResources.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.url.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
    );
  }, [allowedResources, searchQuery]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          background: '#0f172a',
          color: '#ffffff',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={16} color="#38bdf8" />
          <span style={{ fontSize: '0.86rem', fontWeight: 700, letterSpacing: '0.02em' }}>
            Whitelisted Documentation Sandbox
          </span>
          <span
            style={{
              fontSize: '0.68rem',
              background: '#0369a1',
              color: '#e0f2fe',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: 600,
            }}
          >
            Verified Safe
          </span>
        </div>

        <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
          External tabs blocked • Institutional Sandbox
        </div>
      </div>

      {/* Tabs & Search Navigation */}
      <div
        style={{
          padding: '10px 14px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => {
                setActiveTab('CHEAT_SHEETS');
                setActiveExternalUrl(null);
              }}
              style={{
                padding: '5px 12px',
                borderRadius: '5px',
                fontSize: '0.78rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'CHEAT_SHEETS' && !activeExternalUrl ? '#0284c7' : '#e2e8f0',
                color: activeTab === 'CHEAT_SHEETS' && !activeExternalUrl ? '#ffffff' : '#475569',
              }}
            >
              Essential References ({Object.keys(BUILTIN_DOCS).length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('EXTERNAL_RESOURCES')}
              style={{
                padding: '5px 12px',
                borderRadius: '5px',
                fontSize: '0.78rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'EXTERNAL_RESOURCES' || activeExternalUrl ? '#0284c7' : '#e2e8f0',
                color: activeTab === 'EXTERNAL_RESOURCES' || activeExternalUrl ? '#ffffff' : '#475569',
              }}
            >
              Examiner Allowed URLs ({allowedResources.length})
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative' }}>
          <Search
            size={14}
            style={{ position: 'absolute', left: '10px', top: '9px', color: '#94a3b8' }}
          />
          <input
            type="text"
            placeholder="Search syntax, functions, flexbox, joins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{
              paddingLeft: '32px',
              paddingTop: '6px',
              paddingBottom: '6px',
              fontSize: '0.82rem',
              background: '#ffffff',
            }}
          />
        </div>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* If External URL selected, show web iframe sandbox */}
        {activeExternalUrl ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                padding: '6px 12px',
                background: '#f1f5f9',
                borderBottom: '1px solid #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <Globe size={14} color="#0284c7" />
                <span
                  style={{
                    fontSize: '0.76rem',
                    color: '#334155',
                    fontFamily: 'var(--font-mono)',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                  }}
                >
                  {activeExternalUrl}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setActiveExternalUrl(null)}
                className="btn-secondary"
                style={{ padding: '3px 8px', fontSize: '0.72rem' }}
              >
                Close Viewer
              </button>
            </div>

            <iframe
              src={activeExternalUrl}
              title="Whitelisted Resource Sandbox"
              sandbox="allow-scripts allow-same-origin"
              style={{
                flex: 1,
                width: '100%',
                border: 'none',
                background: '#ffffff',
              }}
            />
          </div>
        ) : activeTab === 'CHEAT_SHEETS' ? (
          /* Cheatsheet Split View */
          <div style={{ display: 'flex', width: '100%', height: '100%' }}>
            {/* List Sidebar */}
            <div
              style={{
                width: '240px',
                borderRight: '1px solid #e2e8f0',
                overflowY: 'auto',
                background: '#f8fafc',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              {filteredCheatSheets.map(([key, item]) => {
                const isSelected = selectedDocKey === key;
                return (
                  <div
                    key={key}
                    onClick={() => setSelectedDocKey(key)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '6px',
                      background: isSelected ? '#e0f2fe' : '#ffffff',
                      border: isSelected ? '1px solid #7dd3fc' : '1px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.1s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          color: isSelected ? '#0369a1' : '#64748b',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {item.category}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? '#0369a1' : '#0f172a',
                        lineHeight: 1.3,
                      }}
                    >
                      {item.title}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Document Viewer */}
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', background: '#ffffff' }}>
              {BUILTIN_DOCS[selectedDocKey] ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                      <span className="badge badge-cyan" style={{ fontSize: '0.7rem', marginBottom: '4px' }}>
                        {BUILTIN_DOCS[selectedDocKey].category}
                      </span>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 0 0' }}>
                        {BUILTIN_DOCS[selectedDocKey].title}
                      </h3>
                    </div>
                  </div>

                  <pre
                    style={{
                      background: '#0f172a',
                      color: '#e2e8f0',
                      padding: '16px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontFamily: 'var(--font-mono)',
                      lineHeight: 1.5,
                      overflowX: 'auto',
                    }}
                  >
                    <code>{BUILTIN_DOCS[selectedDocKey].content}</code>
                  </pre>
                </div>
              ) : (
                <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                  Select a reference on the left to view documentation syntax.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* External Whitelisted URLs List */
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
            <div style={{ marginBottom: '12px', fontSize: '0.82rem', color: '#64748b' }}>
              The following technical reference domains are whitelisted by your examiner. Click to open in the integrated sandbox:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredResources.map((res, idx) => (
                <div
                  key={res.url + idx}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '6px',
                        background: '#e0f2fe',
                        color: '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Globe size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                        {res.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                        {res.description}
                      </div>
                      <div
                        style={{
                          fontSize: '0.74rem',
                          color: '#0284c7',
                          fontFamily: 'var(--font-mono)',
                          marginTop: '4px',
                        }}
                      >
                        {res.url}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveExternalUrl(res.url)}
                    className="btn-primary"
                    style={{
                      padding: '7px 14px',
                      fontSize: '0.78rem',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>Open in Sandbox</span>
                    <ExternalLink size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
