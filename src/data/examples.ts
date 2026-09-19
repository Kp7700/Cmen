import { ExampleProgram } from '../types';

export const CMEN_EXAMPLES: ExampleProgram[] = [
  {
    id: 'hello-world',
    title: 'Hello, World!',
    category: 'Basics',
    description: 'The standard rites of initiation. Output released via ejaculate().',
    code: `# hello.cmen — the standard greeting
cum main {

    ejaculate("Hello, World!");

}`,
    expectedOutput: 'Hello, World!',
  },
  {
    id: 'variables-and-seeds',
    title: 'Genes & Seeds',
    category: 'Variables',
    description: 'Declaring mutable genes and immutable seeds.',
    code: `# variables.cmen — declaring state
cum main {

    gene subject = "Cmen";
    gene version = 1.0;
    seed founder = "Anonymous Research Group";

    ejaculate(subject, "v" + version);
    ejaculate("Conceived by:", founder);

}`,
    expectedOutput: `Cmen v1
Conceived by: Anonymous Research Group`,
  },
  {
    id: 'mate-strings',
    title: 'Combining Values with mate',
    category: 'Operators',
    description: 'Using the mate keyword to fuse values into a single lineage.',
    code: `# mate.cmen — combining parents into offspring
cum main {

    gene father = "Hello";
    gene mother = " World!";

    gene child = mate father + mother;

    ejaculate(child);

}`,
    expectedOutput: 'Hello World!',
  },
  {
    id: 'arithmetic',
    title: 'Arithmetic & Precedence',
    category: 'Math',
    description: 'Calculations with proper mathematical operator precedence and remainders.',
    code: `# math.cmen — numeric calculations
cum main {

    gene cells = 4 * 8 + 12 / 3;    # 36
    gene halved = cells / 2;         # 18
    gene remainder = cells % 5;      # 1

    ejaculate("Total cell count:", cells);
    ejaculate("After binary fission:", halved);
    ejaculate("Cellular remainder:", remainder);

}`,
    expectedOutput: `Total cell count: 36
After binary fission: 18
Cellular remainder: 1`,
  },
  {
    id: 'growth-loop',
    title: 'Repetition with grow',
    category: 'Loops',
    description: 'Controlled repetition through generations using the grow statement.',
    code: `# growth.cmen — cellular iteration
cum main {

    ejaculate("Initiating mitotic reproduction sequence...");

    grow cycle from 1 to 4 {
        ejaculate("Generation", cycle, "successfully divided.");
    }

    ejaculate("Colony reached stable equilibrium.");

}`,
    expectedOutput: `Initiating mitotic reproduction sequence...
Generation 1 successfully divided.
Generation 2 successfully divided.
Generation 3 successfully divided.
Generation 4 successfully divided.
Colony reached stable equilibrium.`,
  },
  {
    id: 'broken-error-demo',
    title: 'Diagnostics & Seed Mutation Error',
    category: 'Errors',
    description: 'A deliberately invalid program demonstrating strict compile-time and runtime seed protection.',
    code: `# error_demo.cmen — demonstrating diagnostic precision
cum main {

    seed original_dna = "AGCT-GENOME-V1";

    ejaculate("Active genotype:", original_dna);

    # This mutation violates language biological safety laws:
    mutate original_dna = "MUTATED-GENOME";

    ejaculate("Unreachable statement.");

}`,
    expectedOutput: `Active genotype: AGCT-GENOME-V1
Runtime Error [Line 9]: Cannot mutate 'original_dna' — seeds are immutable. Fixed at conception.`,
  },
  {
    id: 'functions-and-release',
    title: 'Functions with release',
    category: 'Functions',
    description: 'Defining modular cum blocks that compute and release values to callers.',
    code: `# functions.cmen — modular lineage
cum replicate(sample, count) {
    gene result = "";
    grow i from 1 to count {
        mutate result = result + sample;
    }
    release result;
}

cum main {
    gene strand = replicate("ACTG-", 3);
    ejaculate("Replicated strand:", strand);
    ejaculate("Strand length:", length(strand));
}`,
    expectedOutput: `Replicated strand: ACTG-ACTG-ACTG-
Strand length: 15`,
  },
  {
    id: 'conditional-when',
    title: 'Conditionals with when',
    category: 'Branching',
    description: 'Evaluating environmental conditions with when and otherwise branches.',
    code: `# branching.cmen — environmental adaptation
cum main {

    gene incubation_temp = 37.2;

    when (incubation_temp > 38.0) {
        ejaculate("Alert: Heat shock protein activation.");
    } otherwise when (incubation_temp < 36.0) {
        ejaculate("Alert: Hypothermic metabolic slowdown.");
    } otherwise {
        ejaculate("Optimal temperature. Cellular growth flourishing.");
    }

}`,
    expectedOutput: 'Optimal temperature. Cellular growth flourishing.',
  },
];
