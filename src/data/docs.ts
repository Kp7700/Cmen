import { DocSection } from '../types';

export const CMEN_DOCS: DocSection[] = [
  {
    id: 'intro',
    title: 'Introduction',
    category: 'General',
    summary: 'An overview of the Cmen philosophy, origins, and pronunciation guidelines.',
    content: `### What is Cmen?

**Cmen** (pronounced **“C-Men”**) is a small, experimental programming language created to explore what happens when software engineering conventions intersect with biological reproduction terminology.

Despite its provocative nomenclature, Cmen is designed with the rigor of a serious developer tool:
- **Clean lexical structure**: Statements terminate with semicolons, code blocks are bounded with curly braces.
- **Predictable execution**: Deterministic tree-walking interpreter running directly in your browser.
- **Unambiguous output**: Every message is emitted through \`ejaculate()\`.
- **Total commitment**: Zero apologetic disclaimers in syntax. The language accepts its nature and operates with complete professional composure.

### Pronunciation Guide

> **“C-Men”** (IPA: /'siː.mɛn/)  
> Often misheard during video conferences. We recommend using headphones in open-plan offices.`,
    codeSnippet: `cum main {
    ejaculate("Hello, World!");
}`,
    runnable: true,
  },
  {
    id: 'getting-started',
    title: 'Getting Started',
    category: 'General',
    summary: 'How to write, inspect, and execute your first Cmen program in under sixty seconds.',
    content: `### Installation

Because Cmen runs entirely in client-side WebAssembly-free JavaScript, no compiler toolchain, package manager, or C runtime installation is needed on your machine.

You can write and execute programs directly inside the interactive **Playground** on this website.

### Your First Program

Every Cmen source file must define a primary entry point named \`cum main\`:

\`\`\`cmen
cum main {
    ejaculate("Greetings from Cmen.");
}
\`\`\`

When executed, the runtime locates \`cum main\`, constructs a global execution environment, processes each statement sequentially, and outputs the string to the interactive terminal.`,
    codeSnippet: `cum main {
    ejaculate("Greetings from Cmen.");
}`,
    runnable: true,
  },
  {
    id: 'program-structure',
    title: 'Program Structure',
    category: 'Syntax',
    summary: 'Grammar rules, entry points, blocks, and statement termination.',
    content: `### Top-Level Definitions

All executable code in Cmen must reside within a named \`cum\` block. Naked top-level statements outside of blocks are considered unfertilized and will trigger a parse error.

### Grammar Principles

1. **Blocks**: Delimited with \`{\` and \`}\`. Indentation is ignored by the parser but encouraged for reproductive hygiene.
2. **Semicolons**: Every declaration, mutation, expression, release, and output statement must conclude with \`;\`.
3. **Comments**: Single-line comments begin with \`#\` and extend to the end of the line. Multi-line comments can be expressed by repeating \`#\` across consecutive lines.

\`\`\`cmen
# Single line comment explaining genetic ancestry
cum main {
    gene generation = 1; # State declaration
    ejaculate("Generation:", generation);
}
\`\`\``,
    codeSnippet: `# Demonstration of program structure
cum helper() {
    ejaculate("Helper block invoked.");
}

cum main {
    helper();
    ejaculate("Primary execution finished.");
}`,
    runnable: true,
  },
  {
    id: 'variables',
    title: 'Variables & Seeds',
    category: 'Language Core',
    summary: 'Understanding mutable genes, immutable seeds, and the mutate directive.',
    content: `### Genes: Mutable Variables

A \`gene\` represents dynamic state that can evolve throughout the program's lifecycle. Declare a gene using the \`gene\` keyword:

\`\`\`cmen
gene sample_count = 10;
\`\`\`

To update the value of an existing gene, you must explicitly use the \`mutate\` statement or assignment syntax:

\`\`\`cmen
mutate sample_count = sample_count + 5;
\`\`\`

### Seeds: Immutable Constants

A \`seed\` represents primordial state that is permanently locked at the moment of conception. Seeds cannot be reassigned or mutated under any circumstances:

\`\`\`cmen
seed SPECIES_ORIGIN = "Homo Syntacticus";
\`\`\`

Attempting to run \`mutate SPECIES_ORIGIN = "..."\` causes an immediate runtime abort:
> *Cannot mutate 'SPECIES_ORIGIN' — seeds are immutable. Fixed at conception.*`,
    codeSnippet: `cum main {
    seed initial_strain = "Alpha";
    gene current_strain = initial_strain;

    # Mutate the gene without altering the original seed:
    mutate current_strain = mate current_strain + "-Prime";

    ejaculate("Original seed:", initial_strain);
    ejaculate("Evolved gene:", current_strain);
}`,
    runnable: true,
  },
  {
    id: 'output',
    title: 'Output: ejaculate()',
    category: 'Language Core',
    summary: 'Detailed specification of the standard release mechanism.',
    content: `### The ejaculate() Built-in

The core output function of Cmen is \`ejaculate(...)\`. It evaluates its argument expressions and transmits the resulting textual representations to standard output, joined with single spaces and followed by a terminal newline.

\`\`\`cmen
ejaculate("The result is:", 42);
\`\`\`

### Argument Handling

\`ejaculate()\` accepts any number of arguments of any type:
- Strings are emitted without enclosing quotes.
- Numbers are formatted cleanly (integers without decimal points).
- Booleans output as \`true\` or \`false\`.
- Multiple arguments are separated by single spaces.

### Supporting Built-ins

Cmen provides complementary utility functions:
- \`length(text)\`: Returns the character count of a string.
- \`text(val)\`: Explicitly converts any primitive into a string.
- \`number(val)\`: Converts a numeric string into a number.`,
    codeSnippet: `cum main {
    gene metric_a = 15;
    gene metric_b = 27;

    ejaculate("Metric A:", metric_a);
    ejaculate("Metric B:", metric_b);
    ejaculate("Combined Sum:", metric_a + metric_b);
}`,
    runnable: true,
  },
  {
    id: 'operators',
    title: 'Operators & mate',
    category: 'Expressions',
    summary: 'Arithmetic, logical operators, comparisons, and the unique mate keyword.',
    content: `### The mate Keyword

In Cmen, \`mate\` is an affinity operator designed to prepare two values for harmonious union. It converts its target operand to its string representation so that subsequent addition (\`+\`) seamlessly binds them together:

\`\`\`cmen
gene child = mate father + mother;
\`\`\`

### Arithmetic Operators

- \`+\`: Arithmetic addition when both sides are numbers; string concatenation if either operand is text.
- \`-\`: Subtraction (numbers only).
- \`*\`: Multiplication (numbers only).
- \`/\`: Division. Division by zero aborts with an informative diagnostic.
- \`%\`: Remainder / modulo arithmetic.

### Relational & Logical Operators

- Equality: \`==\`, \`!=\`
- Ordering: \`<\`, \`<=\`, \`>\`, \`>=\`
- Logic: \`and\`, \`or\`, \`not\``,
    codeSnippet: `cum main {
    gene left_strand = "C";
    gene right_strand = "men";

    gene combined = mate left_strand + right_strand;
    ejaculate("Union of strands:", combined);

    gene validity = (length(combined) == 4) and not (combined == "");
    ejaculate("Structural validity:", validity);
}`,
    runnable: true,
  },
  {
    id: 'loops',
    title: 'Loops with grow',
    category: 'Control Flow',
    summary: 'Iterating through cycles of generational growth.',
    content: `### The grow Statement

Iteration in Cmen is expressed using the \`grow\` construct. It binds a local loop variable and steps sequentially through each generation:

\`\`\`cmen
grow i from 1 to 5 {
    ejaculate("Generation", i);
}
\`\`\`

### Inclusive Bounds

Unlike zero-indexed ranges in other languages, Cmen believes in total commitment: the upper bound is **inclusive**. A loop \`grow i from 1 to 3\` executes exactly three iterations for values 1, 2, and 3.

If the \`from\` clause is omitted, it defaults to starting at 1:

\`\`\`cmen
grow step to 3 {
    ejaculate("Pulse", step);
}
\`\`\``,
    codeSnippet: `cum main {
    gene organism_weight = 1;

    grow day from 1 to 5 {
        mutate organism_weight = organism_weight * 2;
        ejaculate("Day", day, "biomass:", organism_weight, "grams");
    }
}`,
    runnable: true,
  },
  {
    id: 'functions',
    title: 'Functions & release',
    category: 'Control Flow',
    summary: 'Declaring reusable blocks, argument passing, and emitting return values.',
    content: `### Function Declaration

Every function is defined using the \`cum\` keyword, followed by the function identifier and an optional parameter list:

\`\`\`cmen
cum calculate_biomass(cells, mass_per_cell) {
    release cells * mass_per_cell;
}
\`\`\`

### Returning Values with release

To return a value from a function, use \`release <expr>;\`. This immediately yields the evaluated expression to the caller and terminates execution of the current block.

If a function reaches the end of its body without encountering a \`release\` statement, it implicitly releases \`void\`.`,
    codeSnippet: `cum double_strain(strand) {
    release mate strand + strand;
}

cum main {
    gene sample = double_strain("AGCT-");
    ejaculate("Doubled sequence:", sample);
}`,
    runnable: true,
  },
  {
    id: 'error-handling',
    title: 'Error Handling & die',
    category: 'Diagnostics',
    summary: 'Structured error diagnostics, line highlighting, and deliberate termination.',
    content: `### The die Keyword

When an unrecoverable condition occurs in application logic, a program can deliberately terminate itself with the \`die()\` statement:

\`\`\`cmen
when (toxicity_level > 100) {
    die("Lethal toxicity threshold exceeded.");
}
\`\`\`

### Diagnostic Engine

The Cmen runtime provides precise diagnostics with exact line numbers:
- **Syntax errors**: Highlighted before any statement begins execution.
- **Immutable seed mutations**: Intercepted before memory corruption.
- **Type mismatches**: Clear descriptions of incompatible operands.
- **Safety caps**: Infinite loops are halted at 150,000 steps with an explanatory notice.`,
    codeSnippet: `cum verify_specimen(health) {
    when (health <= 0) {
        die("Specimen non-viable.");
    }
    release "Healthy specimen confirmed.";
}

cum main {
    ejaculate(verify_specimen(95));
}`,
    runnable: true,
  },
  {
    id: 'roadmap',
    title: 'Language Roadmap',
    category: 'Roadmap',
    summary: 'Honest overview of implemented capabilities versus future biological expansions.',
    content: `### Current Release Status: v0.0.1 (Experimental)

To uphold our commitment to professional software engineering, Cmen clearly distinguishes between working features and planned enhancements.

| Capability | Status | Notes |
| :--- | :--- | :--- |
| \`cum main { ... }\` Entry Point | **Implemented** | Primary execution block |
| \`gene\` Mutable Variables | **Implemented** | Dynamic types with mutation checks |
| \`seed\` Immutable Constants | **Implemented** | Hardware-grade runtime protection |
| \`ejaculate()\` Standard Output | **Implemented** | Space-separated multi-argument printer |
| \`mate\` Affinity Operator | **Implemented** | String affinity & concatenation |
| \`grow\` Generational Loops | **Implemented** | Inclusive numeric ranges |
| \`when / otherwise\` Branching | **Implemented** | Full boolean branching support |
| Custom \`cum name()\` Functions | **Implemented** | Parameterized calls with \`release\` |
| \`die()\` Termination Directive | **Implemented** | Fatal exit with custom reason |
| Browser IDE & Console | **Implemented** | Zero-install interactive playground |
| Arrays / Genetic Sequences | *Planned (v0.2)* | Ordered collections of gene cells |
| Structs / Organelles | *Planned (v0.3)* | Composite biological data types |
| Native LLVM Backend | *In Deliberation* | Compiling directly to machine code |`,
    codeSnippet: `cum main {
    ejaculate("Cmen v0.0.1 — verified functional.");
}`,
    runnable: true,
  },
];
