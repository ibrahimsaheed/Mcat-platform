// WHY: This seed file populates the database with real MCAT content so we can
// immediately browse and practice with questions in the UI. It creates categories,
// topics, 25 questions with options, and topic mappings — all in dependency order
// so foreign key constraints are satisfied.
//
// CONCEPT: Prisma runs seed.ts via ts-node after migrations. The file must use
// CommonJS module format (set in package.json prisma.seed) and handle its own
// cleanup (deleteMany in reverse dependency order before inserting).
// WHY: We use the DIRECT_URL (session mode on port 5432) instead of DATABASE_URL
// (transaction mode pooler on port 6543) because the pooler doesn't support
// prepared statements, which Prisma uses for parameterized queries. Session mode
// provides a direct Postgres connection that supports prepared statements.
//
// CONCEPT: Supabase's connection pooler has two modes — transaction (port 6543)
// and session (port 5432). Prisma relies on prepared statements, which only work
// in session mode. The DIRECT_URL env var points to the session mode connection.
import { PrismaClient, Subject } from "@prisma/client";

// Use DIRECT_URL (session mode) to avoid prepared statement errors from the pooler.
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log("🌱 Starting seed...");

  // ── Clean existing data in reverse dependency order ──────────────
  // WHY: We must delete child rows before parents to avoid foreign key
  // constraint violations. Prisma's deleteMany handles this safely.
  await prisma.userAnswerResponse.deleteMany();
  await prisma.quizQuestion.deleteMany();
  await prisma.userQuizAttempt.deleteMany();
  await prisma.simulatedExamResponse.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.questionTopicMap.deleteMany();
  await prisma.questionOption.deleteMany();
  await prisma.questionFeedback.deleteMany();
  await prisma.questionBookmark.deleteMany();
  await prisma.question.deleteMany();
  await prisma.mcatTopic.deleteMany();
  await prisma.questionCategory.deleteMany();

  // ================================================================
  // 1. CATEGORIES
  // ================================================================
  // CONCEPT: QuestionCategory groups questions by MCAT section. The four
  // sections of the MCAT are: Biology/Biochemistry, Chem/Phys,
  // Psych/Soc, and CARS (Critical Analysis & Reasoning).
  const categories = await Promise.all(
    [
      { categoryName: "Biology & Biochemistry", description: "Covers cellular biology, genetics, biochemistry, and molecular biology" },
      { categoryName: "Chemical & Physical Foundations", description: "Covers general chemistry, organic chemistry, and physics" },
      { categoryName: "Psychological & Social Foundations", description: "Covers psychology, sociology, and biology of behavior" },
      { categoryName: "Critical Analysis & Reasoning", description: "Covers reading comprehension and critical analysis of passages" },
    ].map((c) =>
      prisma.questionCategory.create({ data: c })
    )
  );
  console.log(`  ✅ Created ${categories.length} categories`);

  // Build a lookup map so we can reference categories by name later.
  const catMap: Record<string, number> = {};
  categories.forEach((c) => {
    catMap[c.categoryName] = c.id;
  });

  // ================================================================
  // 2. TOPICS
  // ================================================================
  // CONCEPT: McatTopic represents a specific content domain with a subject
  // enum. Topics can have parent-child relationships (e.g., Cell Biology
  // is a child of Biology), but for simplicity we create them flat here.
  const topicsData = [
    // Biology — subject: biology
    { topicName: "Cell Biology", subject: Subject.biology },
    { topicName: "Genetics", subject: Subject.biology },
    // Biochemistry — subject: biochemistry
    { topicName: "Enzymes", subject: Subject.biochemistry },
    { topicName: "Metabolism", subject: Subject.biochemistry },
    // Chemistry — subject: chemistry
    { topicName: "Acid-Base Chemistry", subject: Subject.chemistry },
    { topicName: "Electrochemistry", subject: Subject.chemistry },
    // Physics — subject: physics
    { topicName: "Thermodynamics", subject: Subject.physics },
    { topicName: "Kinematics", subject: Subject.physics },
    // Psychology — subject: psychology
    { topicName: "Memory & Cognition", subject: Subject.psychology },
    { topicName: "Social Behavior", subject: Subject.psychology },
    // Sociology — subject: sociology
    { topicName: "Social Stratification", subject: Subject.sociology },
    { topicName: "Health Disparities", subject: Subject.sociology },
  ];

  const topics = await Promise.all(
    topicsData.map((t) =>
      prisma.mcatTopic.create({ data: t })
    )
  );

  const topicMap: Record<string, number> = {};
  topics.forEach((t) => {
    topicMap[t.topicName] = t.id;
  });
  console.log(`  ✅ Created ${topics.length} topics`);

  // ================================================================
  // 3. QUESTIONS & OPTIONS
  // ================================================================
  // CONCEPT: Each question has exactly 4 options (one correct). We create
  // them in a transaction so that if any question fails to insert, none
  // are committed. After inserting the question, we create its options,
  // then create the topic mapping.

  interface QuestionInput {
    questionText: string;
    explanation: string;
    difficultyLevel: number;
    categoryName: string;
    topicNames: string[];
    options: { optionText: string; isCorrect: boolean; optionOrder: number }[];
  }

  const questionsData: QuestionInput[] = [
    // ═══════════════════════════════════════════════
    // CELL BIOLOGY (Biology)
    // ═══════════════════════════════════════════════
    {
      questionText:
        "Which organelle is primarily responsible for the production of ATP via oxidative phosphorylation?",
      explanation:
        "Mitochondria are the site of oxidative phosphorylation, where the electron transport chain creates a proton gradient that drives ATP synthase. The inner mitochondrial membrane houses the ETC complexes, and the matrix contains the Krebs cycle enzymes. Chloroplasts are involved in photosynthesis, the Golgi apparatus modifies and packages proteins, and the endoplasmic reticulum is involved in protein and lipid synthesis.",
      difficultyLevel: 2,
      categoryName: "Biology & Biochemistry",
      topicNames: ["Cell Biology"],
      options: [
        { optionText: "Mitochondrion", isCorrect: true, optionOrder: 1 },
        { optionText: "Golgi apparatus", isCorrect: false, optionOrder: 2 },
        { optionText: "Chloroplast", isCorrect: false, optionOrder: 3 },
        { optionText: "Endoplasmic reticulum", isCorrect: false, optionOrder: 4 },
      ],
    },
    {
      questionText:
        "Which of the following correctly describes the movement of water across a semipermeable membrane?",
      explanation:
        "Osmosis is the passive movement of water from an area of low solute concentration (high water concentration) to an area of high solute concentration (low water concentration) across a semipermeable membrane. Active transport requires energy to move substances against gradients, diffusion moves solutes (not water specifically), and facilitated diffusion uses carrier proteins for specific molecules.",
      difficultyLevel: 1,
      categoryName: "Biology & Biochemistry",
      topicNames: ["Cell Biology"],
      options: [
        { optionText: "Water moves from low solute concentration to high solute concentration", isCorrect: true, optionOrder: 1 },
        { optionText: "Water moves from high solute concentration to low solute concentration", isCorrect: false, optionOrder: 2 },
        { optionText: "Solute moves against its concentration gradient", isCorrect: false, optionOrder: 3 },
        { optionText: "ATP is required for water movement", isCorrect: false, optionOrder: 4 },
      ],
    },
    {
      questionText:
        "A cell is placed in a hypertonic solution. What will most likely happen to the cell?",
      explanation:
        "In a hypertonic solution, the extracellular fluid has a higher solute concentration than the cytoplasm. Water moves out of the cell via osmosis, causing the cell to shrink (crenate). In a hypotonic solution, water enters and the cell swells. Isotonic solutions have equal solute concentrations, so no net water movement occurs.",
      difficultyLevel: 2,
      categoryName: "Biology & Biochemistry",
      topicNames: ["Cell Biology"],
      options: [
        { optionText: "The cell will shrink", isCorrect: true, optionOrder: 1 },
        { optionText: "The cell will swell and burst", isCorrect: false, optionOrder: 2 },
        { optionText: "There will be no change", isCorrect: false, optionOrder: 3 },
        { optionText: "The cell will undergo mitosis", isCorrect: false, optionOrder: 4 },
      ],
    },

    // ═══════════════════════════════════════════════
    // GENETICS (Biology)
    // ═══════════════════════════════════════════════
    {
      questionText:
        "In a monohybrid cross between two heterozygous (Aa) individuals, what is the expected phenotypic ratio of dominant to recessive traits in the offspring?",
      explanation:
        "A cross between two heterozygotes (Aa × Aa) yields offspring with genotypes: AA (1/4), Aa (1/2), and aa (1/4). Since A is dominant over a, both AA and Aa display the dominant phenotype, giving a 3:1 phenotypic ratio. The 1:2:1 ratio is the genotypic ratio, and 9:3:3:1 is the dihybrid phenotypic ratio.",
      difficultyLevel: 1,
      categoryName: "Biology & Biochemistry",
      topicNames: ["Genetics"],
      options: [
        { optionText: "3:1", isCorrect: true, optionOrder: 1 },
        { optionText: "1:2:1", isCorrect: false, optionOrder: 2 },
        { optionText: "9:3:3:1", isCorrect: false, optionOrder: 3 },
        { optionText: "1:1", isCorrect: false, optionOrder: 4 },
      ],
    },
    {
      questionText:
        "Which of the following best describes the function of an operon in prokaryotic gene regulation?",
      explanation:
        "An operon is a cluster of genes transcribed as a single mRNA molecule under the control of a single promoter. It allows coordinated expression of multiple genes that function in the same pathway. The lac operon is a classic example where the presence of lactose induces transcription of genes needed for lactose metabolism. Enhancers and silencers are eukaryotic regulatory elements, and telomeres protect chromosome ends.",
      difficultyLevel: 3,
      categoryName: "Biology & Biochemistry",
      topicNames: ["Genetics"],
      options: [
        { optionText: "A cluster of genes transcribed together under one promoter", isCorrect: true, optionOrder: 1 },
        { optionText: "A DNA sequence that enhances transcription of a distant gene", isCorrect: false, optionOrder: 2 },
        { optionText: "A protein that binds to DNA and represses transcription", isCorrect: false, optionOrder: 3 },
        { optionText: "A region at the end of a chromosome that protects it from degradation", isCorrect: false, optionOrder: 4 },
      ],
    },
    {
      questionText:
        "A mutation changes a DNA codon from GAA to GAG, but the amino acid sequence remains unchanged. This type of mutation is called:",
      explanation:
        "A silent mutation changes a nucleotide but does not alter the encoded amino acid due to the degeneracy of the genetic code (multiple codons can code for the same amino acid). Both GAA and GAG code for glutamic acid. Missense mutations change the amino acid, nonsense mutations create a premature stop codon, and frameshift mutations result from insertions or deletions that shift the reading frame.",
      difficultyLevel: 2,
      categoryName: "Biology & Biochemistry",
      topicNames: ["Genetics"],
      options: [
        { optionText: "Silent mutation", isCorrect: true, optionOrder: 1 },
        { optionText: "Missense mutation", isCorrect: false, optionOrder: 2 },
        { optionText: "Nonsense mutation", isCorrect: false, optionOrder: 3 },
        { optionText: "Frameshift mutation", isCorrect: false, optionOrder: 4 },
      ],
    },

    // ═══════════════════════════════════════════════
    // ENZYMES (Biochemistry)
    // ═══════════════════════════════════════════════
    {
      questionText:
        "Which enzyme is responsible for unwinding the DNA double helix during replication?",
      explanation:
        "Helicase breaks the hydrogen bonds between complementary base pairs, unwinding the DNA double helix at the replication fork. DNA Polymerase III synthesizes new DNA strands, Primase lays down RNA primers for DNA polymerase to extend from, and Ligase seals the gaps between Okazaki fragments on the lagging strand.",
      difficultyLevel: 2,
      categoryName: "Biology & Biochemistry",
      topicNames: ["Enzymes"],
      options: [
        { optionText: "Helicase", isCorrect: true, optionOrder: 1 },
        { optionText: "DNA Polymerase III", isCorrect: false, optionOrder: 2 },
        { optionText: "Primase", isCorrect: false, optionOrder: 3 },
        { optionText: "Ligase", isCorrect: false, optionOrder: 4 },
      ],
    },
    {
      questionText:
        "In competitive enzyme inhibition, how does increasing the substrate concentration affect the inhibition?",
      explanation:
        "Competitive inhibition occurs when an inhibitor binds to the active site of the enzyme, competing with the substrate. Increasing substrate concentration overcomes this competition because more substrate molecules outcompete the inhibitor for the active site. Thus, Vmax remains achievable at high substrate concentrations, though Km increases. Noncompetitive inhibition cannot be overcome by adding substrate because the inhibitor binds elsewhere.",
      difficultyLevel: 3,
      categoryName: "Biology & Biochemistry",
      topicNames: ["Enzymes"],
      options: [
        { optionText: "It reduces the inhibition because substrate outcompetes the inhibitor", isCorrect: true, optionOrder: 1 },
        { optionText: "It increases the inhibition because more enzyme-substrate complexes form", isCorrect: false, optionOrder: 2 },
        { optionText: "It has no effect on the inhibition", isCorrect: false, optionOrder: 3 },
        { optionText: "It irreversibly denatures the enzyme", isCorrect: false, optionOrder: 4 },
      ],
    },

    // ═══════════════════════════════════════════════
    // METABOLISM (Biochemistry)
    // ═══════════════════════════════════════════════
    {
      questionText:
        "In which cellular compartment does glycolysis occur?",
      explanation:
        "Glycolysis occurs in the cytoplasm (cytosol) of the cell. It is the first stage of glucose catabolism, breaking one glucose molecule into two pyruvate molecules with a net gain of 2 ATP and 2 NADH. The Krebs cycle occurs in the mitochondrial matrix, and oxidative phosphorylation occurs at the inner mitochondrial membrane. The nucleus houses genetic material and transcription.",
      difficultyLevel: 1,
      categoryName: "Biology & Biochemistry",
      topicNames: ["Metabolism"],
      options: [
        { optionText: "Cytoplasm", isCorrect: true, optionOrder: 1 },
        { optionText: "Mitochondrial matrix", isCorrect: false, optionOrder: 2 },
        { optionText: "Inner mitochondrial membrane", isCorrect: false, optionOrder: 3 },
        { optionText: "Nucleus", isCorrect: false, optionOrder: 4 },
      ],
    },
    {
      questionText:
        "During the Krebs cycle, the carbon atoms from acetyl-CoA are ultimately converted to:",
      explanation:
        "The Krebs cycle (citric acid cycle) fully oxidizes acetyl-CoA to carbon dioxide (CO₂). Each turn of the cycle releases two CO₂ molecules, along with generating 3 NADH, 1 FADH₂, and 1 GTP (or ATP). These reduced electron carriers then feed into the electron transport chain. Lactic acid is produced during anaerobic glycolysis, and ethanol is produced during fermentation in some organisms.",
      difficultyLevel: 3,
      categoryName: "Biology & Biochemistry",
      topicNames: ["Metabolism"],
      options: [
        { optionText: "Carbon dioxide (CO₂)", isCorrect: true, optionOrder: 1 },
        { optionText: "Lactic acid", isCorrect: false, optionOrder: 2 },
        { optionText: "Ethanol", isCorrect: false, optionOrder: 3 },
        { optionText: "Acetyl-CoA", isCorrect: false, optionOrder: 4 },
      ],
    },

    // ═══════════════════════════════════════════════
    // ACID-BASE CHEMISTRY (Chemistry)
    // ═══════════════════════════════════════════════
    {
      questionText:
        "What is the pH of a 0.001 M HCl solution at 25°C?",
      explanation:
        "HCl is a strong acid that dissociates completely in water: HCl → H⁺ + Cl⁻. A 0.001 M HCl solution produces [H⁺] = 0.001 M = 10⁻³ M. pH = -log[H⁺] = -log(10⁻³) = 3. pH = 1 would correspond to 0.1 M HCl, pH = 7 is neutral, and pH = 11 is basic (corresponding to [OH⁻] = 10⁻³ M).",
      difficultyLevel: 1,
      categoryName: "Chemical & Physical Foundations",
      topicNames: ["Acid-Base Chemistry"],
      options: [
        { optionText: "3", isCorrect: true, optionOrder: 1 },
        { optionText: "1", isCorrect: false, optionOrder: 2 },
        { optionText: "7", isCorrect: false, optionOrder: 3 },
        { optionText: "11", isCorrect: false, optionOrder: 4 },
      ],
    },
    {
      questionText:
        "A buffer solution works by resisting changes in pH because it contains:",
      explanation:
        "A buffer contains a weak acid and its conjugate base (or a weak base and its conjugate acid). When a small amount of acid (H⁺) is added, the conjugate base neutralizes it. When a small amount of base (OH⁻) is added, the weak acid neutralizes it. This dual action maintains relatively constant pH. Strong acids and bases cannot buffer because they fully dissociate.",
      difficultyLevel: 2,
      categoryName: "Chemical & Physical Foundations",
      topicNames: ["Acid-Base Chemistry"],
      options: [
        { optionText: "A weak acid and its conjugate base", isCorrect: true, optionOrder: 1 },
        { optionText: "A strong acid and its conjugate base", isCorrect: false, optionOrder: 2 },
        { optionText: "Equal concentrations of H⁺ and OH⁻", isCorrect: false, optionOrder: 3 },
        { optionText: "A salt that precipitates excess acid or base", isCorrect: false, optionOrder: 4 },
      ],
    },
    {
      questionText:
        "What is the conjugate base of H₂CO₃ (carbonic acid)?",
      explanation:
        "When H₂CO₃ donates a proton (H⁺), it becomes HCO₃⁻ (bicarbonate). The conjugate base is what remains after the acid loses a proton. H₂CO₃ → H⁺ + HCO₃⁻. CO₃²⁻ is the conjugate base of HCO₃⁻ (the second deprotonation), H₃O⁺ is the conjugate acid of water, and OH⁻ is the conjugate base of water.",
      difficultyLevel: 2,
      categoryName: "Chemical & Physical Foundations",
      topicNames: ["Acid-Base Chemistry"],
      options: [
        { optionText: "HCO₃⁻", isCorrect: true, optionOrder: 1 },
        { optionText: "CO₃²⁻", isCorrect: false, optionOrder: 2 },
        { optionText: "H₃O⁺", isCorrect: false, optionOrder: 3 },
        { optionText: "OH⁻", isCorrect: false, optionOrder: 4 },
      ],
    },

    // ═══════════════════════════════════════════════
    // ELECTROCHEMISTRY (Chemistry)
    // ═══════════════════════════════════════════════
    {
      questionText:
        "In a galvanic (voltaic) cell, oxidation occurs at which electrode?",
      explanation:
        "In a galvanic cell, oxidation occurs at the anode (An Ox — Anode Oxidation). Electrons flow from the anode to the cathode through the external circuit. The cathode is where reduction occurs. The salt bridge maintains electrical neutrality by allowing ions to flow between half-cells. The voltmeter measures the cell potential, not the site of oxidation.",
      difficultyLevel: 2,
      categoryName: "Chemical & Physical Foundations",
      topicNames: ["Electrochemistry"],
      options: [
        { optionText: "Anode", isCorrect: true, optionOrder: 1 },
        { optionText: "Cathode", isCorrect: false, optionOrder: 2 },
        { optionText: "Salt bridge", isCorrect: false, optionOrder: 3 },
        { optionText: "Voltmeter", isCorrect: false, optionOrder: 4 },
      ],
    },
    {
      questionText:
        "The Nernst equation allows calculation of the cell potential under:",
      explanation:
        "The Nernst equation, E = E° - (RT/nF)ln(Q), calculates the cell potential under non-standard conditions by accounting for the reaction quotient (Q). Standard conditions (1 M, 1 atm, 25°C) give the standard cell potential E°. The equation corrects E° based on actual concentrations and temperature. It does not directly relate to reaction rate, equilibrium position, or Gibbs free energy (though ΔG = -nFE).",
      difficultyLevel: 3,
      categoryName: "Chemical & Physical Foundations",
      topicNames: ["Electrochemistry"],
      options: [
        { optionText: "Non-standard conditions", isCorrect: true, optionOrder: 1 },
        { optionText: "Standard conditions only", isCorrect: false, optionOrder: 2 },
        { optionText: "Maximum reaction rate", isCorrect: false, optionOrder: 3 },
        { optionText: "Equilibrium conditions", isCorrect: false, optionOrder: 4 },
      ],
    },

    // ═══════════════════════════════════════════════
    // THERMODYNAMICS (Physics)
    // ═══════════════════════════════════════════════
    {
      questionText:
        "Which law of thermodynamics states that the entropy of an isolated system always increases or remains constant?",
      explanation:
        "The Second Law of Thermodynamics states that the total entropy of an isolated system never decreases over time — it either increases (for irreversible processes) or remains constant (for reversible processes). The First Law concerns energy conservation, the Third Law states that absolute zero cannot be reached, and the Zeroth Law establishes thermal equilibrium as the basis for temperature measurement.",
      difficultyLevel: 2,
      categoryName: "Chemical & Physical Foundations",
      topicNames: ["Thermodynamics"],
      options: [
        { optionText: "Second Law", isCorrect: true, optionOrder: 1 },
        { optionText: "First Law", isCorrect: false, optionOrder: 2 },
        { optionText: "Third Law", isCorrect: false, optionOrder: 3 },
        { optionText: "Zeroth Law", isCorrect: false, optionOrder: 4 },
      ],
    },
    {
      questionText:
        "In an isothermal expansion of an ideal gas, which of the following remains constant?",
      explanation:
        "Isothermal means 'constant temperature.' For an ideal gas undergoing isothermal expansion, the internal energy (U) depends only on temperature, so ΔU = 0. Since the gas expands, volume increases and pressure decreases (Boyle's Law: PV = constant at constant T). The gas does work on the surroundings, and heat must be absorbed to maintain constant temperature.",
      difficultyLevel: 3,
      categoryName: "Chemical & Physical Foundations",
      topicNames: ["Thermodynamics"],
      options: [
        { optionText: "Internal energy", isCorrect: true, optionOrder: 1 },
        { optionText: "Pressure", isCorrect: false, optionOrder: 2 },
        { optionText: "Volume", isCorrect: false, optionOrder: 3 },
        { optionText: "Work done by the gas", isCorrect: false, optionOrder: 4 },
      ],
    },

    // ═══════════════════════════════════════════════
    // KINEMATICS (Physics)
    // ═══════════════════════════════════════════════
    {
      questionText:
        "A ball is dropped from rest from a height of 45 m. Neglecting air resistance, approximately how long does it take to reach the ground? (g = 10 m/s²)",
      explanation:
        "Using the kinematic equation for constant acceleration: d = ½gt², where d = 45 m, g = 10 m/s². Solving for t: 45 = ½(10)(t²) → 45 = 5t² → t² = 9 → t = 3 s. If the ball were dropped from 80 m, it would take 4 s (since 80 = 5t² → t² = 16 → t = 4 s).",
      difficultyLevel: 1,
      categoryName: "Chemical & Physical Foundations",
      topicNames: ["Kinematics"],
      options: [
        { optionText: "3 seconds", isCorrect: true, optionOrder: 1 },
        { optionText: "4 seconds", isCorrect: false, optionOrder: 2 },
        { optionText: "2 seconds", isCorrect: false, optionOrder: 3 },
        { optionText: "5 seconds", isCorrect: false, optionOrder: 4 },
      ],
    },
    {
      questionText:
        "An object moving with constant acceleration triples its speed over a given distance. What happens to its kinetic energy?",
      explanation:
        "Kinetic energy is given by KE = ½mv². If speed triples (v → 3v), the new KE = ½m(3v)² = ½m(9v²) = 9 × (½mv²) = 9 times the original KE. Since mass remains constant, KE scales with the square of velocity. Tripling speed results in a 9-fold increase in kinetic energy, not 3-fold (linear) or 6-fold.",
      difficultyLevel: 3,
      categoryName: "Chemical & Physical Foundations",
      topicNames: ["Kinematics"],
      options: [
        { optionText: "It increases by a factor of 9", isCorrect: true, optionOrder: 1 },
        { optionText: "It increases by a factor of 3", isCorrect: false, optionOrder: 2 },
        { optionText: "It increases by a factor of 6", isCorrect: false, optionOrder: 3 },
        { optionText: "It remains the same", isCorrect: false, optionOrder: 4 },
      ],
    },

    // ═══════════════════════════════════════════════
    // MEMORY & COGNITION (Psychology)
    // ═══════════════════════════════════════════════
    {
      questionText:
        "Which type of long-term memory includes facts, concepts, and general knowledge about the world?",
      explanation:
        "Semantic memory is a subtype of explicit (declarative) long-term memory that stores general knowledge, facts, and concepts about the world that are not tied to personal experience. Episodic memory stores personal experiences and events. Procedural memory stores skills and habits (implicit memory). Working memory is a short-term system for temporarily holding and manipulating information.",
      difficultyLevel: 2,
      categoryName: "Psychological & Social Foundations",
      topicNames: ["Memory & Cognition"],
      options: [
        { optionText: "Semantic memory", isCorrect: true, optionOrder: 1 },
        { optionText: "Episodic memory", isCorrect: false, optionOrder: 2 },
        { optionText: "Procedural memory", isCorrect: false, optionOrder: 3 },
        { optionText: "Working memory", isCorrect: false, optionOrder: 4 },
      ],
    },
    {
      questionText:
        "The serial position effect describes the tendency to better recall items at the beginning and end of a list. The enhanced recall of items at the beginning is primarily attributed to:",
      explanation:
        "The primacy effect (better recall of early items) occurs because these items receive more rehearsal and are more likely to be transferred to long-term memory. The recency effect (better recall of late items) is attributed to those items still being held in short-term/working memory. Encoding refers to initial processing, and retrieval is accessing stored information.",
      difficultyLevel: 3,
      categoryName: "Psychological & Social Foundations",
      topicNames: ["Memory & Cognition"],
      options: [
        { optionText: "Greater rehearsal and transfer to long-term memory", isCorrect: true, optionOrder: 1 },
        { optionText: "These items are still held in working memory", isCorrect: false, optionOrder: 2 },
        { optionText: "Enhanced encoding due to novelty", isCorrect: false, optionOrder: 3 },
        { optionText: "Reduced interference from similar items", isCorrect: false, optionOrder: 4 },
      ],
    },

    // ═══════════════════════════════════════════════
    // SOCIAL BEHAVIOR (Psychology)
    // ═══════════════════════════════════════════════
    {
      questionText:
        "Which psychological theory suggests that people attribute their own behavior to situational factors but others' behavior to dispositional factors?",
      explanation:
        "The fundamental attribution error (also called correspondence bias) describes the tendency to overemphasize dispositional (personality-based) explanations for others' behavior while underestimating situational factors. The actor-observer bias extends this: as actors, we see our own behavior as situationally driven, but as observers, we attribute others' behavior to their dispositions. Cognitive dissonance refers to discomfort from conflicting beliefs, and social loafing describes reduced effort in groups.",
      difficultyLevel: 3,
      categoryName: "Psychological & Social Foundations",
      topicNames: ["Social Behavior"],
      options: [
        { optionText: "Fundamental attribution error", isCorrect: true, optionOrder: 1 },
        { optionText: "Cognitive dissonance", isCorrect: false, optionOrder: 2 },
        { optionText: "Social loafing", isCorrect: false, optionOrder: 3 },
        { optionText: "Group polarization", isCorrect: false, optionOrder: 4 },
      ],
    },
    {
      questionText:
        "Which concept refers to the tendency for individuals to exert less effort when working in a group compared to working alone?",
      explanation:
        "Social loafing is the phenomenon where individuals exert less effort in a group setting because their individual contribution is less identifiable. Deindividuation is the loss of self-awareness in groups, groupthink is the tendency to conform to group consensus at the cost of critical thinking, and the bystander effect is the decreased likelihood of helping when others are present.",
      difficultyLevel: 2,
      categoryName: "Psychological & Social Foundations",
      topicNames: ["Social Behavior"],
      options: [
        { optionText: "Social loafing", isCorrect: true, optionOrder: 1 },
        { optionText: "Deindividuation", isCorrect: false, optionOrder: 2 },
        { optionText: "Groupthink", isCorrect: false, optionOrder: 3 },
        { optionText: "Bystander effect", isCorrect: false, optionOrder: 4 },
      ],
    },

    // ═══════════════════════════════════════════════
    // SOCIAL STRATIFICATION (Sociology)
    // ═══════════════════════════════════════════════
    {
      questionText:
        "Which theoretical perspective argues that social stratification serves a functional purpose by ensuring that the most qualified individuals fill the most important roles in society?",
      explanation:
        "The Davis-Moore thesis (functionalist perspective on stratification) argues that social inequality is necessary because it motivates people to train for and fill socially important positions that require rare talents or extensive training. The higher rewards (income, prestige) attached to these positions ensure they are filled by the most capable people. Conflict theory sees stratification as a result of exploitation, and symbolic interactionism focuses on micro-level interactions.",
      difficultyLevel: 4,
      categoryName: "Psychological & Social Foundations",
      topicNames: ["Social Stratification"],
      options: [
        { optionText: "Davis-Moore thesis", isCorrect: true, optionOrder: 1 },
        { optionText: "Conflict theory", isCorrect: false, optionOrder: 2 },
        { optionText: "Symbolic interactionism", isCorrect: false, optionOrder: 3 },
        { optionText: "Labeling theory", isCorrect: false, optionOrder: 4 },
      ],
    },
    {
      questionText:
        "Social determinants of health are best described as:",
      explanation:
        "Social determinants of health are the conditions in the environments where people are born, live, learn, work, play, worship, and age that affect a wide range of health outcomes. These include socioeconomic status, education, neighborhood and physical environment, employment, and social support networks. Genetic factors are biological (not social), healthcare access is only one aspect, and while lifestyle choices matter, social determinants are the broader structural factors that constrain or enable these choices.",
      difficultyLevel: 2,
      categoryName: "Psychological & Social Foundations",
      topicNames: ["Health Disparities"],
      options: [
        { optionText: "The environmental conditions that affect health outcomes and quality of life", isCorrect: true, optionOrder: 1 },
        { optionText: "The genetic predisposition to certain diseases", isCorrect: false, optionOrder: 2 },
        { optionText: "The quality of healthcare facilities in a region", isCorrect: false, optionOrder: 3 },
        { optionText: "Individual lifestyle choices that affect health", isCorrect: false, optionOrder: 4 },
      ],
    },

  ];

  console.log(`  Creating ${questionsData.length} questions...`);

  // WHY: We create questions in sequence rather than with Promise.all so that
  // we maintain predictable ordering (question IDs 1-25).
  for (const q of questionsData) {
    const question = await prisma.question.create({
      data: {
        questionText: q.questionText,
        explanation: q.explanation,
        questionType: "multiple_choice",
        difficultyLevel: q.difficultyLevel,
        pointValue: 1,
        verificationStatus: "VERIFIED",
        isActive: true,
        categoryId: catMap[q.categoryName],
        // Create the 4 options
        options: {
          create: q.options,
        },
      },
    });

    // Create topic mappings for this question
    for (const topicName of q.topicNames) {
      const topicId = topicMap[topicName];
      if (topicId) {
        await prisma.questionTopicMap.create({
          data: {
            questionId: question.id,
            topicId,
          },
        });
      }
    }
  }

  console.log(`  ✅ Created ${questionsData.length} questions with options and topic mappings`);

  // ================================================================
  // 4. QUIZZES
  // ================================================================
  // CONCEPT: Quizzes group questions into timed practice sets. Each quiz
  // has a name, description, time limit, and links to questions through
  // QuizQuestion records.
  //
  // WHY: We fetch the questions we just created by their topic subjects to
  // build focused practice sets. This avoids hardcoding IDs which would
  // break if the seed order changes.

  // Fetch all questions with their topic maps to sort by subject.
  const allQuestions = await prisma.question.findMany({
    where: { isActive: true },
    include: {
      topicMaps: { include: { topic: true } },
    },
    orderBy: { id: "asc" },
  });

  // Group questions by their topic subject
  function questionsBySubject(subject: string) {
    return allQuestions.filter((q) =>
      q.topicMaps.some((tm) => tm.topic.subject === subject)
    );
  }

  const bioQuestions = questionsBySubject("biology");
  const chemQuestions = questionsBySubject("chemistry");
  const physicsQuestions = questionsBySubject("physics");
  const biochemQuestions = questionsBySubject("biochemistry");
  const psychQuestions = questionsBySubject("psychology");
  const socQuestions = questionsBySubject("sociology");

  // Quiz 1: Biology Fundamentals — 8 biology questions
  const bioQuiz = await prisma.quiz.create({
    data: {
      quizName: "Biology Fundamentals",
      description: "Core biology concepts tested on the MCAT",
      totalQuestions: 8,
      totalPoints: 8,
      timeLimit: 480,
      isActive: true,
      quizQuestions: {
        create: bioQuestions.slice(0, 8).map((q, i) => ({
          questionId: q.id,
          questionOrder: i + 1,
        })),
      },
    },
  });
  console.log(`  ✅ Created quiz "${bioQuiz.quizName}" with ${bioQuestions.slice(0, 8).length} bio questions`);

  // Quiz 2: Chemistry Essentials — 5 chemistry + 2 physics questions
  const chemQuizQuestions = [...chemQuestions.slice(0, 5), ...physicsQuestions.slice(0, 3)];
  const chemQuiz = await prisma.quiz.create({
    data: {
      quizName: "Chemistry Essentials",
      description: "Key chemistry concepts for MCAT prep",
      totalQuestions: 8,
      totalPoints: 8,
      timeLimit: 480,
      isActive: true,
      quizQuestions: {
        create: chemQuizQuestions.map((q, i) => ({
          questionId: q.id,
          questionOrder: i + 1,
        })),
      },
    },
  });
  console.log(`  ✅ Created quiz "${chemQuiz.quizName}" with ${chemQuizQuestions.length} chem/physics questions`);

  // Quiz 3: Mixed Practice Set — 3 psych/soc + 2 biochem + 2 bio + 2 chem
  const mixedQuestions = [
    ...psychQuestions.slice(0, 2),
    ...socQuestions.slice(0, 2),
    ...biochemQuestions.slice(0, 2),
    ...bioQuestions.slice(0, 1),
    ...chemQuestions.slice(0, 2),
  ];
  const mixedQuiz = await prisma.quiz.create({
    data: {
      quizName: "Mixed Practice Set",
      description: "Mixed questions across all subjects",
      totalQuestions: 9,
      totalPoints: 9,
      timeLimit: 540,
      isActive: true,
      quizQuestions: {
        create: mixedQuestions.map((q, i) => ({
          questionId: q.id,
          questionOrder: i + 1,
        })),
      },
    },
  });
  console.log(`  ✅ Created quiz "${mixedQuiz.quizName}" with ${mixedQuestions.length} mixed questions`);

  console.log("🌱 Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
