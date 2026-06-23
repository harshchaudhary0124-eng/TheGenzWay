export type QuestionDef = {
  id: string;
  question: string | ((answers: Record<string, string>) => string);
  options: string[] | ((answers: Record<string, string>) => string[]);
};

export type DomainFlow = {
  label: string;
  questions: [QuestionDef, QuestionDef, QuestionDef, QuestionDef];
};

// ─── Branch helpers (one per domain, keyed on Q1 answer id) ────────────────────

const expStage  = (a: Record<string, string>) => a["stage"]  === "Exploring";
const expLevel  = (a: Record<string, string>) => a["level"]  === "Exploring";
const expType   = (a: Record<string, string>) => a["type"]   === "Exploring";
const expRole   = (a: Record<string, string>) => a["role"]   === "Exploring";
const expDomain = (a: Record<string, string>) => a["domain"] === "Exploring";

// ─── Domain flows ───────────────────────────────────────────────────────────────

export const DOMAIN_FLOWS: Record<string, DomainFlow> = {

  // ── Entrepreneurship ──────────────────────────────────────────────────────────
  "Entrepreneurship": {
    label: "Entrepreneurship",
    questions: [
      {
        id: "stage",
        question: "What's your current stage?",
        options: ["Exploring", "Idea stage", "Pre-seed", "Early stage", "Growth stage", "Freelancing / agency", "Other"],
      },
      {
        id: "focus",
        question: (a) => expStage(a) ? "What are you looking for right now?" : "What are you building?",
        options: (a) => expStage(a)
          ? ["A startup idea", "A co-founder", "A problem to solve", "An early product to join", "People to brainstorm with", "AI / software space", "Other"]
          : ["AI SaaS", "Fintech", "Consumer app", "B2B SaaS", "Marketplace", "D2C / eCommerce", "Developer tools", "EdTech / HealthTech", "Other"],
      },
      {
        id: "context",
        question: (a) => expStage(a) ? "What space excites you most?" : "What's your team size?",
        options: (a) => expStage(a)
          ? ["AI / automation", "SaaS / software", "Fintech", "Creator economy", "Consumer internet", "Developer tools", "Deep tech", "Open to anything strong", "Other"]
          : ["Solo", "2–5", "6–10", "10+", "Other"],
      },
      {
        id: "intent",
        question: (a) => expStage(a) ? "Who do you want to meet here?" : "What are you looking for here?",
        options: (a) => expStage(a)
          ? ["Founders", "Developers", "Designers", "AI builders", "Operators / growth", "Ambitious students", "Open to anyone serious", "Other"]
          : ["Co-founder / early team", "Product / tech help", "Design / brand help", "Feedback from founders", "Growth / GTM help", "Investors / ecosystem", "Accountability circle", "Other"],
      },
    ],
  },

  // ── Artificial Intelligence ───────────────────────────────────────────────────
  "Artificial Intelligence": {
    label: "Artificial Intelligence",
    questions: [
      {
        id: "level",
        question: "What's your experience with AI?",
        options: ["Exploring", "Just starting out", "Student / learner", "Hobbyist builder", "Working professionally", "Researching AI", "Building AI products", "Other"],
      },
      {
        id: "area",
        question: (a) => expLevel(a) ? "What aspect of AI are you curious about?" : "What's your primary area?",
        options: (a) => expLevel(a)
          ? ["How AI actually works", "Building with AI APIs", "Using AI for my project", "Career in AI", "AI's impact on the world", "Other"]
          : ["LLMs / Generative AI", "Computer Vision", "ML / Data Science", "AI Agents / Automation", "AI Research", "AI Safety / Alignment", "Applied AI in a product", "Other"],
      },
      {
        id: "work",
        question: (a) => expLevel(a) ? "What's your current situation?" : "What does your current work look like?",
        options: (a) => expLevel(a)
          ? ["Student", "Working in another field", "Between things / transitioning", "Building something", "Just curious", "Other"]
          : ["Personal projects", "Startup / product", "Academic research", "Industry role", "Freelancing", "Exploring / learning", "Other"],
      },
      {
        id: "intent",
        question: (a) => expLevel(a) ? "Who do you want to connect with?" : "What do you want from this community?",
        options: (a) => expLevel(a)
          ? ["AI practitioners to learn from", "Builders using AI in products", "Researchers", "People transitioning into AI", "Open to anyone in AI", "Other"]
          : ["Technical collaborators", "Research peers", "Project partners", "Mentorship", "Stay updated on the field", "Find opportunities", "Other"],
      },
    ],
  },

  // ── Software / Development ────────────────────────────────────────────────────
  "Software / Development": {
    label: "Software / Development",
    questions: [
      {
        id: "level",
        question: "How would you describe your experience?",
        options: ["Exploring", "< 1 year — just starting", "1–3 years — building up", "3–7 years — solid", "7+ years — deep", "Student", "Other"],
      },
      {
        id: "area",
        question: (a) => expLevel(a) ? "What draws you to software / development?" : "What's your primary area?",
        options: (a) => expLevel(a)
          ? ["Want to learn to code", "Building my own product", "Career switch into tech", "Curious about how software works", "Working on a side project idea", "Other"]
          : ["Frontend", "Backend", "Full-stack", "Mobile (iOS / Android)", "DevOps / Infra", "Embedded / Systems", "Game dev", "Data engineering", "Other"],
      },
      {
        id: "work",
        question: (a) => expLevel(a) ? "Where are you right now?" : "What are you working on right now?",
        options: (a) => expLevel(a)
          ? ["No coding experience yet", "Tried a few tutorials", "Built something small", "Non-tech professional", "Student in another area", "Other"]
          : ["Open source", "Startup / product", "Freelance", "Day job", "Student projects", "Exploring ideas", "Other"],
      },
      {
        id: "intent",
        question: (a) => expLevel(a) ? "What would be most useful for you?" : "What are you looking for here?",
        options: (a) => expLevel(a)
          ? ["Mentors or guides", "Learning community", "People to build with", "Career advice in tech", "Project ideas to get started", "Other"]
          : ["Collaborators / contributors", "Code reviews / feedback", "Project ideas", "Job opportunities", "Open source community", "Mentorship", "Other"],
      },
    ],
  },

  // ── Design ────────────────────────────────────────────────────────────────────
  "Design": {
    label: "Design",
    questions: [
      {
        id: "type",
        question: "What kind of design do you do?",
        options: ["Exploring", "Product / UX", "UI / Visual", "Brand / Identity", "Motion / Animation", "3D / Spatial", "Design systems", "Fullstack (design + code)", "Other"],
      },
      {
        id: "mode",
        question: (a) => expType(a) ? "What draws you to design?" : "What's your current work mode?",
        options: (a) => expType(a)
          ? ["Visual aesthetics and creativity", "Product thinking / UX", "Brand and identity", "Motion and animation", "Career switch into design", "Other"]
          : ["Freelancing", "At a company", "Startup / founding team", "Student", "Personal projects", "Career transition", "Other"],
      },
      {
        id: "focus",
        question: (a) => expType(a) ? "Where are you right now?" : "What's your main focus area?",
        options: (a) => expType(a)
          ? ["No design background yet", "Tried Figma / design tools", "Developer wanting design skills", "Non-designer wanting to learn", "Building something that needs design", "Other"]
          : ["Mobile apps", "Web products", "SaaS tools", "Consumer brands", "AI interfaces", "Content / media", "Physical / print", "Other"],
      },
      {
        id: "intent",
        question: (a) => expType(a) ? "What would be most useful for you?" : "What are you looking for here?",
        options: (a) => expType(a)
          ? ["Designers to learn from", "Feedback on early ideas", "Collab on a project", "Understand design thinking", "Career path guidance", "Other"]
          : ["Dev collaborators to build with", "Creative feedback", "Design mentorship", "Client work", "Startup to join", "Design community", "Other"],
      },
    ],
  },

  // ── Blockchain / Web3 ─────────────────────────────────────────────────────────
  "Blockchain / Web3": {
    label: "Blockchain / Web3",
    questions: [
      {
        id: "role",
        question: "What's your role in Web3?",
        options: ["Exploring", "Builder / Developer", "Investor", "Researcher", "Founder", "Community builder", "Other"],
      },
      {
        id: "area",
        question: (a) => expRole(a) ? "What about Web3 interests you?" : "What's your focus area?",
        options: (a) => expRole(a)
          ? ["The technology itself", "Investment / financial angle", "Decentralization philosophy", "NFTs / digital ownership", "Building on blockchain", "Other"]
          : ["DeFi", "NFTs / Digital art", "Infrastructure / L2s", "DAOs / Governance", "Gaming / GameFi", "Identity / Privacy", "Dev tooling", "Real-world assets", "Other"],
      },
      {
        id: "status",
        question: (a) => expRole(a) ? "Where are you coming from?" : "What's your current status?",
        options: (a) => expRole(a)
          ? ["Traditional finance / investing", "Software development", "Completely new to crypto", "Following it for a while", "Heard about it recently", "Other"]
          : ["Learning the space", "Active builder", "Working on a project", "Exploring opportunities", "Investing / following", "Other"],
      },
      {
        id: "intent",
        question: (a) => expRole(a) ? "What would be most helpful for you?" : "What are you looking for here?",
        options: (a) => expRole(a)
          ? ["People to explain the basics", "Builders in the space", "Honest perspectives on Web3", "Investment / alpha community", "Technical deep-dives", "Other"]
          : ["Technical co-builders", "Community", "Investment thesis discussion", "Projects to contribute to", "Research / alpha", "Collab on ideas", "Other"],
      },
    ],
  },

  // ── Product / Startups ────────────────────────────────────────────────────────
  "Product / Startups": {
    label: "Product / Startups",
    questions: [
      {
        id: "role",
        question: "What's your role?",
        options: ["Exploring", "Product Manager", "Founder / Co-founder", "Product Designer", "Product Analyst", "Aspiring PM", "Eng lead doing product", "Other"],
      },
      {
        id: "context",
        question: (a) => expRole(a) ? "What interests you about product / startups?" : "What's your current context?",
        options: (a) => expRole(a)
          ? ["Want to build a startup someday", "Transitioning into product management", "Understanding how products are built", "Joining an early startup", "Early-stage investing", "Other"]
          : ["Pre-product / ideation", "Early-stage startup", "Growth-stage startup", "Large company", "Freelance / consulting", "Learning / student", "Other"],
      },
      {
        id: "area",
        question: (a) => expRole(a) ? "What's your current background?" : "What kind of products do you work on?",
        options: (a) => expRole(a)
          ? ["Engineering / technical", "Design", "Business / non-tech", "Student", "Working in a different field", "Other"]
          : ["Consumer products", "B2B / enterprise", "Mobile apps", "AI-powered products", "Developer tools", "Marketplace / platform", "Other"],
      },
      {
        id: "intent",
        question: (a) => expRole(a) ? "Who do you want to meet here?" : "What are you looking for here?",
        options: (a) => expRole(a)
          ? ["Founders to learn from", "Product managers", "People who've shipped something", "Potential co-founders", "Open to everyone in this space", "Other"]
          : ["Technical co-founders", "Design partners", "User feedback / builders", "Investors / ecosystem", "Career opportunities", "PM / founder community", "Other"],
      },
    ],
  },

  // ── Content Creation ──────────────────────────────────────────────────────────
  "Content Creation": {
    label: "Content Creation",
    questions: [
      {
        id: "type",
        question: "What kind of content do you create?",
        options: ["Exploring", "Short-form video", "Long-form video", "Written content / newsletter", "Podcast", "Photography / visual", "Live streaming", "Mix of formats", "Other"],
      },
      {
        id: "platform",
        question: (a) => expType(a) ? "What aspect of content creation interests you?" : "What's your main platform?",
        options: (a) => expType(a)
          ? ["Building an audience", "Sharing what I know", "Creative expression", "Building a personal brand", "Monetizing through content", "Other"]
          : ["Instagram / TikTok", "YouTube", "Twitter / X", "LinkedIn", "Substack / Ghost", "Multiple platforms", "Other"],
      },
      {
        id: "stage",
        question: (a) => expType(a) ? "Have you created anything yet?" : "Where are you right now?",
        options: (a) => expType(a)
          ? ["Not yet, still planning", "Tried a few posts / videos", "Created briefly then stopped", "Active consumer wanting to create", "Building a brand for something", "Other"]
          : ["Just starting out", "Under 10K followers", "10K–100K", "100K+", "Building a media brand", "Creating for a company", "Other"],
      },
      {
        id: "intent",
        question: (a) => expType(a) ? "What kind of support do you want?" : "What are you looking for here?",
        options: (a) => expType(a)
          ? ["Creators to learn from", "Accountability / community", "Platform and niche advice", "Tools and workflow tips", "Collab opportunities", "Other"]
          : ["Collab creators", "Brand deals / sponsorships", "Community to grow with", "Tools / systems advice", "Build beyond content (product / brand)", "Strategic feedback", "Other"],
      },
    ],
  },

  // ── Marketing / Growth ────────────────────────────────────────────────────────
  "Marketing / Growth": {
    label: "Marketing / Growth",
    questions: [
      {
        id: "role",
        question: "What's your role?",
        options: ["Exploring", "Founder doing marketing", "In-house marketer", "Growth lead", "Agency / freelance", "Student / learning", "Marketing consultant", "Other"],
      },
      {
        id: "area",
        question: (a) => expRole(a) ? "What aspect of marketing / growth interests you?" : "What's your focus area?",
        options: (a) => expRole(a)
          ? ["Growing an audience or community", "Marketing for my startup / product", "Career in marketing", "Learning growth strategies", "Performance and data marketing", "Other"]
          : ["Performance / paid ads", "SEO / content", "Social media", "Email marketing", "Product-led growth", "Community-led growth", "Brand building", "Analytics / data", "Other"],
      },
      {
        id: "context",
        question: (a) => expRole(a) ? "What's your current situation?" : "What's your current context?",
        options: (a) => expRole(a)
          ? ["Building something that needs growth", "Transitioning into marketing", "Student / recently graduated", "Working in a non-marketing role", "Entrepreneur / solopreneur", "Other"]
          : ["Early-stage startup", "Growth-stage startup", "Agency", "Enterprise", "Freelancing", "Side projects", "Other"],
      },
      {
        id: "intent",
        question: (a) => expRole(a) ? "What would be most useful for you?" : "What are you looking for here?",
        options: (a) => expRole(a)
          ? ["Marketers to learn from", "Practical growth tactics", "Accountability and feedback", "Find people to work with", "Community of growth-focused people", "Other"]
          : ["Collab on campaigns", "Growth experiments to discuss", "Skill-building community", "Job / project opportunities", "Tools and workflows", "Founding team to join", "Other"],
      },
    ],
  },

  // ── Finance / Investing ───────────────────────────────────────────────────────
  "Finance / Investing": {
    label: "Finance / Investing",
    questions: [
      {
        id: "role",
        question: "What's your role / context?",
        options: ["Exploring", "Student of finance", "Working in finance", "Angel investor", "VC / fund", "Founder seeking funding", "Crypto / DeFi investor", "Personal finance / FIRE", "Other"],
      },
      {
        id: "area",
        question: (a) => expRole(a) ? "What aspect of finance / investing interests you?" : "What's your focus area?",
        options: (a) => expRole(a)
          ? ["Startup / venture ecosystem", "Personal wealth building", "Public markets / stocks", "Crypto / digital assets", "Understanding how money works", "Other"]
          : ["Venture capital", "Angel investing", "Public markets", "Crypto / DeFi", "Personal finance", "Corporate finance", "FinTech building", "Other"],
      },
      {
        id: "interest",
        question: (a) => expRole(a) ? "What's your starting point?" : "What are you most interested in right now?",
        options: (a) => expRole(a)
          ? ["Very new to finance", "Some basic knowledge", "Working in a non-finance field", "Building a company needing funding", "Already investing informally", "Other"]
          : ["Learning / education", "Actively investing", "Building in fintech", "Connecting with the ecosystem", "Research and analysis", "Other"],
      },
      {
        id: "intent",
        question: (a) => expRole(a) ? "What kind of connections do you want?" : "What are you looking for here?",
        options: (a) => expRole(a)
          ? ["Investors to learn from", "Financial literacy community", "Founders and operators", "People in venture / angels", "Honest no-hype perspectives", "Other"]
          : ["Investment opportunities", "Founders to back", "Financial knowledge-sharing", "Network in finance", "FinTech collab", "Research peers", "Other"],
      },
    ],
  },

  // ── Research / Deep Tech ──────────────────────────────────────────────────────
  "Research / Deep Tech": {
    label: "Research / Deep Tech",
    questions: [
      {
        id: "domain",
        question: "What domain are you in?",
        options: ["Exploring", "Biotech / Life sciences", "Material science", "Climate tech", "Quantum computing", "Neuroscience", "Robotics", "Space tech", "Hard tech / manufacturing", "Other"],
      },
      {
        id: "role",
        question: (a) => expDomain(a) ? "What draws you to deep tech / research?" : "What's your role?",
        options: (a) => expDomain(a)
          ? ["Fascinated by a specific field", "Want to work in research", "Building in hard tech", "Science communicator / writer", "Investor in deep tech", "Other"]
          : ["Academic researcher", "Industry researcher", "PhD / Masters student", "Building a deep tech startup", "Investor in deep tech", "Science communicator", "Other"],
      },
      {
        id: "work",
        question: (a) => expDomain(a) ? "What's your current background?" : "What does your current work look like?",
        options: (a) => expDomain(a)
          ? ["STEM student", "Working in a different field", "Science enthusiast", "Entrepreneur interested in deep tech", "Recently finished a degree", "Other"]
          : ["Active research project", "PhD / Masters program", "Early startup", "Corporate R&D", "Independent research", "Exploring fields", "Other"],
      },
      {
        id: "intent",
        question: (a) => expDomain(a) ? "What would be most valuable for you?" : "What are you looking for here?",
        options: (a) => expDomain(a)
          ? ["Researchers to connect with", "Understanding commercialization paths", "Deep tech founders and builders", "Science writing / communication community", "Just following the frontier", "Other"]
          : ["Research collaborators", "Technical co-founders", "Funding / investors", "Path to commercialization", "Community of researchers", "Science enthusiasts", "Other"],
      },
    ],
  },
};

export function getDomainFlow(domain: string): DomainFlow {
  return DOMAIN_FLOWS[domain] ?? DOMAIN_FLOWS["Entrepreneurship"];
}
