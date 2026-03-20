// Engineering Practical Question Bank & Whitelisted Documentation Catalog

export interface WhitelistedResource {
  title: string;
  url: string;
  description: string;
  category: 'DOCUMENTATION' | 'SPECIFICATION' | 'ASSETS';
}

export interface StarterFile {
  filename: string;
  language: 'html' | 'css' | 'javascript' | 'python' | 'sql' | 'cpp' | 'java';
  content: string;
}

export interface EvaluationCriterion {
  criteria: string;
  marks: number;
}

export interface PracticalBankItem {
  id: string;
  title: string;
  subject: 'WT' | 'DSA' | 'DBMS' | 'OS';
  subjectName: string;
  practicalType: 'PRACTICAL_WEB' | 'PRACTICAL_CODE' | 'PRACTICAL_SQL';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  marks: number;
  problemStatement: string;
  constraints: string[];
  starterFiles: StarterFile[];
  whitelistedResources: WhitelistedResource[];
  rubric: EvaluationCriterion[];
}

export const PRACTICAL_SUBJECTS = [
  { key: 'WT', name: 'Web Technologies (WT)', lab: 'Web Architecture & Full-Stack Lab' },
  { key: 'DSA', name: 'Data Structures & Algorithms (DSA)', lab: 'Algorithms & Computing Lab' },
  { key: 'DBMS', name: 'Database Management Systems (DBMS)', lab: 'Enterprise Database Lab' },
  { key: 'OS', name: 'Operating Systems & Systems Programming', lab: 'Systems & Networks Lab' },
];

export const PRACTICAL_QUESTION_BANK: PracticalBankItem[] = [
  // ==========================================
  // WEB TECHNOLOGIES (WT) PRACTICALS
  // ==========================================
  {
    id: 'wt_prac_1',
    title: 'Student Registration & Validation Portal',
    subject: 'WT',
    subjectName: 'Web Technologies (WT)',
    practicalType: 'PRACTICAL_WEB',
    difficulty: 'Medium',
    marks: 25,
    problemStatement: `Develop a responsive Student Examination Registration Portal.
Requirements:
1. Construct an accessible HTML5 form collecting: Full Name, Roll Number, Department, Email, and Password with Confirmation.
2. Implement modern responsive styling with CSS Grid or Flexbox, clear focus outlines, and responsive layout for mobile (<600px) and desktop (>600px).
3. Author client-side JavaScript validation without external libraries:
   - Roll number must match the institutional format (e.g., 2026-CS-XXX).
   - Password must contain at least 8 characters, 1 uppercase letter, 1 digit, and 1 special symbol.
   - Live error feedback displayed adjacent to each input field upon blur or submit.
4. On valid submission, prevent default page reload, construct a structured JSON object representing the student, and render a formatted summary card below the form.`,
    constraints: [
      'Pure Vanilla HTML5, CSS3, and JavaScript only. No external UI frameworks (no Bootstrap, no Tailwind).',
      'Form must not submit if any field is invalid.',
      'Must work cross-browser on Chrome, Firefox, and Safari.'
    ],
    whitelistedResources: [
      {
        title: 'MDN Web Docs - HTML Forms & Input Types',
        url: 'https://developer.mozilla.org/en-US/docs/Learn/Forms',
        description: 'Official Mozilla guide to form elements, attributes, and input types',
        category: 'DOCUMENTATION'
      },
      {
        title: 'MDN Web Docs - Constraint Validation API',
        url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Constraint_validation',
        description: 'JavaScript APIs for custom form validity checking and error reporting',
        category: 'DOCUMENTATION'
      },
      {
        title: 'MDN Web Docs - CSS Flexbox & Grid Guides',
        url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Grids',
        description: 'Responsive styling layout patterns and responsive breakpoints',
        category: 'DOCUMENTATION'
      }
    ],
    starterFiles: [
      {
        filename: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Student Registration Portal</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="registration-container">
    <header class="header">
      <h1>Department of Computer Engineering</h1>
      <p>Practical Exam Registration</p>
    </header>

    <!-- TODO: Implement the student registration form -->
    <form id="registrationForm" novalidate>
      <!-- Add input fields here with semantic labels and error containers -->
    </form>

    <!-- TODO: Render submission confirmation card here -->
    <div id="summaryCard" class="hidden"></div>
  </div>

  <script src="script.js"></script>
</body>
</html>`
      },
      {
        filename: 'style.css',
        language: 'css',
        content: `/* Student Examination Registration Portal Styles */
:root {
  --primary: #0284c7;
  --primary-hover: #0369a1;
  --bg-color: #f8fafc;
  --card-bg: #ffffff;
  --text-main: #0f172a;
  --text-muted: #64748b;
  --error: #dc2626;
  --success: #16a34a;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: system-ui, -apple-system, sans-serif;
}

body {
  background: var(--bg-color);
  color: var(--text-main);
  padding: 32px 16px;
}

.registration-container {
  max-width: 640px;
  margin: 0 auto;
  background: var(--card-bg);
  padding: 32px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}

/* TODO: Complete responsive form styling, input states, and summary card */`
      },
      {
        filename: 'script.js',
        language: 'javascript',
        content: `// Student Examination Registration Logic
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registrationForm');
  const summaryCard = document.getElementById('summaryCard');

  // TODO: Add validation regex patterns
  // Institutional Roll Number: e.g. 2026-CS-XXX
  // Password complexity: 8+ chars, 1 uppercase, 1 digit, 1 special character

  // TODO: Attach submit event listener with e.preventDefault()
});`
      }
    ],
    rubric: [
      { criteria: 'HTML5 Semantic Layout & Accessibility (Labels, fieldsets, ARIA)', marks: 5 },
      { criteria: 'Responsive CSS Grid/Flexbox Layout and Visual Polish', marks: 5 },
      { criteria: 'Client-Side RegEx & Form Validation Logic', marks: 10 },
      { criteria: 'Dynamic DOM Output & Form State Management', marks: 5 }
    ]
  },
  {
    id: 'wt_prac_2',
    title: 'Interactive Asynchronous Data Dashboard with Filter & Search',
    subject: 'WT',
    subjectName: 'Web Technologies (WT)',
    practicalType: 'PRACTICAL_WEB',
    difficulty: 'Hard',
    marks: 30,
    problemStatement: `Construct a dynamic single-page metrics dashboard that fetches and renders technical course inventory asynchronously.
Requirements:
1. Perform an asynchronous fetch request to retrieve candidate courses / system data (mock JSON array provided).
2. Implement live client-side debounced text search (instant filtering as candidate types).
3. Provide category filter dropdowns (e.g. Systems, Databases, Artificial Intelligence) and sort options (Alphabetical, Credits, Level).
4. Implement an interactive modal dialog displaying detailed course prerequisites upon card click.
5. Handle empty states (e.g. "No matching courses found") and asynchronous loading animations.`,
    constraints: [
      'Pure client-side JavaScript. No external libraries.',
      'Must handle edge cases where search query matches zero items.',
      'Debounce search inputs by at least 250 milliseconds.'
    ],
    whitelistedResources: [
      {
        title: 'MDN Web Docs - Using the Fetch API',
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch',
        description: 'Complete guide to fetch(), Promises, async/await, and JSON parsing',
        category: 'DOCUMENTATION'
      },
      {
        title: 'MDN Web Docs - DOM Manipulation & Template Elements',
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model',
        description: 'Element creation, event delegation, and dynamic rendering patterns',
        category: 'DOCUMENTATION'
      }
    ],
    starterFiles: [
      {
        filename: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Engineering Curriculum Dashboard</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="dashboard-wrapper">
    <header>
      <h2>Computer Science Engineering Course Catalog</h2>
      <div class="controls-bar">
        <input type="text" id="searchInput" placeholder="Search courses by title or code...">
        <select id="categoryFilter">
          <option value="ALL">All Disciplines</option>
          <option value="SYSTEMS">Systems & OS</option>
          <option value="THEORY">Theory & Algorithms</option>
          <option value="DATA">Data & AI</option>
        </select>
      </div>
    </header>

    <main id="coursesGrid" class="courses-grid">
      <!-- Dynamic course cards injected here -->
    </main>
  </div>

  <script src="script.js"></script>
</body>
</html>`
      },
      {
        filename: 'style.css',
        language: 'css',
        content: `body {
  margin: 0;
  padding: 24px;
  background: #f1f5f9;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 24px;
}`
      },
      {
        filename: 'script.js',
        language: 'javascript',
        content: `// Sample Course Data Payload
const COURSE_CATALOG = [
  { id: 'CS301', title: 'Operating Systems & Concurrency', category: 'SYSTEMS', credits: 4, level: 'Advanced' },
  { id: 'CS302', title: 'Database Management Systems', category: 'DATA', credits: 4, level: 'Intermediate' },
  { id: 'CS303', title: 'Design & Analysis of Algorithms', category: 'THEORY', credits: 4, level: 'Advanced' },
  { id: 'CS304', title: 'Computer Networks & Security', category: 'SYSTEMS', credits: 3, level: 'Intermediate' },
  { id: 'CS305', title: 'Machine Learning & Neural Networks', category: 'DATA', credits: 3, level: 'Advanced' },
  { id: 'CS306', title: 'Automata Theory & Computability', category: 'THEORY', credits: 3, level: 'Intermediate' }
];

// TODO: Implement async rendering, debounced filtering, and sorting logic`
      }
    ],
    rubric: [
      { criteria: 'Asynchronous / JSON Data Pipeline & Initial Render', marks: 10 },
      { criteria: 'Search Debounce & Multi-Category Filtering Logic', marks: 10 },
      { criteria: 'Interactive Details Modal & Dynamic Event Delegation', marks: 5 },
      { criteria: 'CSS Grid Responsiveness & Empty Search State', marks: 5 }
    ]
  },

  // ==========================================
  // DATA STRUCTURES & ALGORITHMS (DSA)
  // ==========================================
  {
    id: 'dsa_prac_1',
    title: 'Balanced Binary Search Tree with Traversal & Height Telemetry',
    subject: 'DSA',
    subjectName: 'Data Structures & Algorithms',
    practicalType: 'PRACTICAL_CODE',
    difficulty: 'Medium',
    marks: 25,
    problemStatement: `Implement a Binary Search Tree (BST) in Python or JavaScript that supports:
1. Recursive Insertion maintaining the BST ordering invariant.
2. In-Order, Pre-Order, and Post-Order traversals returning ordered arrays.
3. Node Search returning the node depth or -1 if absent.
4. Calculate Tree Height and identify if the tree is currently height-balanced (|height(left) - height(right)| <= 1 for every node).`,
    constraints: [
      'Must handle edge cases: empty tree, single node tree, skewed tree.',
      'Time complexity for search in balanced tree must be O(log n).'
    ],
    whitelistedResources: [
      {
        title: 'Python Official Documentation - Data Structures',
        url: 'https://docs.python.org/3/tutorial/datastructures.html',
        description: 'Standard Python list, class, and recursion specifications',
        category: 'DOCUMENTATION'
      }
    ],
    starterFiles: [
      {
        filename: 'bst.py',
        language: 'python',
        content: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

class BinarySearchTree:
    def __init__(self):
        self.root = None

    def insert(self, val: int) -> None:
        """Insert a value into the BST preserving the ordering property."""
        # TODO: Implement insertion logic
        pass

    def inorder_traversal(self) -> list:
        """Return array of values visited in-order."""
        # TODO: Implement in-order traversal
        return []

    def get_height(self) -> int:
        """Calculate maximum tree depth (height)."""
        # TODO: Implement height calculation
        return 0

    def is_balanced(self) -> bool:
        """Determine if the tree is height-balanced."""
        # TODO: Implement balance check
        return True

# Test Harness
if __name__ == "__main__":
    bst = BinarySearchTree()
    for num in [50, 30, 70, 20, 40, 60, 80]:
        bst.insert(num)
    print("Inorder:", bst.inorder_traversal())
    print("Height:", bst.get_height())
    print("Is Balanced:", bst.is_balanced())`
      }
    ],
    rubric: [
      { criteria: 'Correct BST Insertion & Invariant Maintenance', marks: 8 },
      { criteria: 'Recursive Traversal Algorithms (Inorder, Preorder)', marks: 7 },
      { criteria: 'Tree Height & Balance Telemetry Computation', marks: 10 }
    ]
  },

  // ==========================================
  // DATABASE MANAGEMENT SYSTEMS (DBMS / SQL)
  // ==========================================
  {
    id: 'dbms_prac_1',
    title: 'University Department & Course Enrollment Relational Schema',
    subject: 'DBMS',
    subjectName: 'Database Management Systems',
    practicalType: 'PRACTICAL_SQL',
    difficulty: 'Medium',
    marks: 25,
    problemStatement: `Write standard SQL queries against the University Academic Database:
1. Formulate an INNER JOIN query finding all students enrolled in "Advanced Operating Systems" with their grade points.
2. Formulate a GROUP BY and HAVING query finding departments having more than 3 active professors with average salary > $80,000.
3. Formulate a subquery or Window function ranking the top 2 highest scoring students in each department.
4. Construct a View 'V_DepartmentMetrics' displaying department name, total students, total courses, and average GPA.`,
    constraints: [
      'Standard ANSI SQL syntax.',
      'All column aliases must match the specified problem requirements exactly.'
    ],
    whitelistedResources: [
      {
        title: 'PostgreSQL / SQL Official Reference Documentation',
        url: 'https://www.postgresql.org/docs/current/sql-commands.html',
        description: 'Official PostgreSQL query syntax, window functions, and joins',
        category: 'DOCUMENTATION'
      }
    ],
    starterFiles: [
      {
        filename: 'queries.sql',
        language: 'sql',
        content: `-- ==========================================
-- University Examination SQL Solution Script
-- ==========================================

-- Query 1: Students enrolled in 'Advanced Operating Systems'
-- Write your SELECT query here:


-- Query 2: Departments with > 3 professors & avg salary > 80,000
-- Write your GROUP BY / HAVING query here:


-- Query 3: Top 2 highest scoring students per department
-- Write your Window function (DENSE_RANK / ROW_NUMBER) query here:


-- Query 4: Create view V_DepartmentMetrics
-- Write your CREATE VIEW statement here:
`
      }
    ],
    rubric: [
      { criteria: 'Multi-table Relational Joins & Filtering', marks: 6 },
      { criteria: 'Aggregate Functions & HAVING clause precision', marks: 6 },
      { criteria: 'Window Functions / Departmental Ranking', marks: 8 },
      { criteria: 'View Definition & Syntactic Correctness', marks: 5 }
    ]
  }
];

export const DEFAULT_WHITELISTED_RESOURCES: WhitelistedResource[] = [
  {
    title: 'MDN Web Docs (HTML/CSS/JS Reference)',
    url: 'https://developer.mozilla.org/en-US/docs/Web',
    description: 'Standard documentation for web technologies, APIs, and syntax.',
    category: 'DOCUMENTATION',
  },
  {
    title: 'Python Official Documentation (3.11+)',
    url: 'https://docs.python.org/3/',
    description: 'Standard library reference, built-in functions, and data structures.',
    category: 'DOCUMENTATION',
  },
  {
    title: 'PostgreSQL Manual & SQL Command Reference',
    url: 'https://www.postgresql.org/docs/current/sql-commands.html',
    description: 'SQL queries, aggregation, joins, and window functions reference.',
    category: 'DOCUMENTATION',
  },
  {
    title: 'cppreference.com (C++ Standard Reference)',
    url: 'https://en.cppreference.com/w/',
    description: 'C++ STL containers, algorithms, and syntax reference.',
    category: 'DOCUMENTATION',
  },
];

export function filterPracticalBank(options: {
  subject?: string;
  difficulty?: string;
  searchQuery?: string;
}): PracticalBankItem[] {
  return PRACTICAL_QUESTION_BANK.filter((item) => {
    if (options.subject && options.subject !== 'ALL' && item.subject !== options.subject) {
      return false;
    }
    if (options.difficulty && options.difficulty !== 'ALL' && item.difficulty.toUpperCase() !== options.difficulty.toUpperCase()) {
      return false;
    }
    if (options.searchQuery && options.searchQuery.trim()) {
      const q = options.searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSubject = item.subjectName.toLowerCase().includes(q);
      const matchDesc = item.problemStatement.toLowerCase().includes(q);
      if (!matchTitle && !matchSubject && !matchDesc) return false;
    }
    return true;
  });
}
