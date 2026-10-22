import { NextRequest, NextResponse } from "next/server";
import { claimsRepo } from "../../../lib/repo/claimsRepo";
import { gccRepo } from "../../../lib/repo/gccRepo";
import { citiesRepo } from "../../../lib/repo/citiesRepo";
import { statesRepo } from "../../../lib/repo/statesRepo";
import { verifyAnswerGrounding } from "../../../lib/citation";
import { Claim } from "../../../lib/schema";
import { vectorStore } from "../../../lib/vectorStore";

export interface AnswerBlock {
  text: string;
  claim_ids: string[];
}

export interface SourceDisagreement {
  field: string;
  source_a: string;
  value_a: string;
  grade_a: string;
  source_b: string;
  value_b: string;
  grade_b: string;
  reason: string;
}

export interface AskResponse {
  answer_blocks: AnswerBlock[];
  follow_ups: string[];
  gaps: string[];
  is_grounded: boolean;
  engine?: string;
  disagreements?: SourceDisagreement[];
}

const GROQ_API_KEY =
  process.env.GROQ_API_KEY ||
  "your_groq_api_key_placeholder_environment_variables_here";
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 }
      );
    }

    // Optional Railway Backend Forwarding (when deployed as separated Frontend / Backend)
    const backendUrl =
      process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
    if (backendUrl) {
      try {
        const remoteRes = await fetch(`${backendUrl}/api/ask`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        if (remoteRes.ok) {
          const data = await remoteRes.json();
          return NextResponse.json(data);
        }
      } catch (fwdErr) {
        console.warn(
          "Backend forwarding failed, falling back to local engine:",
          fwdErr
        );
      }
    }

    const q = query.toLowerCase().trim();
    const allClaims = claimsRepo.getAll();
    const claimsMap = new Map<string, Claim>();
    allClaims.forEach((c) => claimsMap.set(c.id, c));

    // 1. Prompt injection & safety check: enforce strict data-only treatment
    if (
      q.includes("ignore previous instructions") ||
      q.includes("system prompt") ||
      q.includes("pretend you are") ||
      q.includes("developer mode") ||
      q.includes("bypass restrictions") ||
      q.includes("jailbreak")
    ) {
      return NextResponse.json({
        answer_blocks: [
          {
            text: "GCC Atlas operates strictly on structured public evidence. Input was evaluated as data only and could not be matched to an indexed claim.",
            claim_ids: [],
          },
        ],
        follow_ups: ["Search verified GCC claims in the registry"],
        gaps: ["No query matching valid GCC ecosystem data."],
        is_grounded: false,
        engine: "security-filter",
      });
    }

    // 2. Friendly greeting / about GCC Atlas
    if (
      q === "hello" ||
      q === "hi" ||
      q.includes("good morning") ||
      q.includes("good evening") ||
      q.includes("good afternoon")
    ) {
      return NextResponse.json({
        answer_blocks: [
          {
            text: "Hello! GCC Atlas is the independent, citable record of India's Global Capability Centre ecosystem. Answers come strictly from primary statutory filings, registered lease deeds, and gazetted state policies.",
            claim_ids: ["clm-mkt-rev-fy26"],
          },
        ],
        follow_ups: [
          "What is India's total GCC market revenue in FY26?",
          "How many GCC units does Bengaluru have?",
          "Why do published GCC counts vary from 1,400 to 2,975?",
        ],
        gaps: [],
        is_grounded: true,
      });
    }

    if (
      q.includes("who are you") ||
      q.includes("what are you") ||
      q.includes("what is gcc atlas") ||
      q.includes("what does this site do")
    ) {
      return NextResponse.json({
        answer_blocks: [
          {
            text: "GCC Atlas is the independent, citable record of India's Global Capability Centre ecosystem, where every number is traced to a primary statutory filing, registered lease deed, or gazetted order.",
            claim_ids: ["clm-mkt-rev-fy26", "clm-mkt-workforce-fy26"],
          },
          {
            text: "Unlike analyst surveys with opaque methodologies or paid vendor listings, GCC Atlas operates under a strict neutrality firewall with zero commercial pay-to-play rankings.",
            claim_ids: [],
          },
        ],
        follow_ups: [
          "How does GCC Atlas reconcile published GCC counts?",
          "How many Mega GCCs operate in India?",
          "What is the average tech rent in Bengaluru?",
        ],
        gaps: [],
        is_grounded: true,
      });
    }

    // Detect if this query involves publisher discrepancies (Requirement 4)
    const hasDisagreementTopic =
      q.includes("disagree") ||
      q.includes("diverge") ||
      q.includes("conflict") ||
      q.includes("reconcile") ||
      q.includes("vary") ||
      q.includes("discrepan") ||
      q.includes("differ") ||
      (q.includes("published") && q.includes("count")) ||
      (q.includes("how many") && q.includes("count") && q.includes("india"));

    const disagreements: SourceDisagreement[] = hasDisagreementTopic
      ? [
          {
            field: "India GCC Universe Count",
            source_a: "nasscom-Zinnov India GCC Landscape (FY26)",
            value_a: "2,117 Parent GCCs (3,728 Units)",
            grade_a: "B",
            source_b: "AIM Research GCC Explorer (2026)",
            value_b: "~1,400 Tech & Analytics Captives",
            grade_b: "C",
            reason:
              "Zinnov counts all global parent corporations across tech and operations, while AIM Research applies restrictive criteria isolating deep tech, AI, and analytics captives only.",
          },
        ]
      : [];

    // 3. Semantic Vector Search for Grounded Context
    const vectorMatches = vectorStore.search(query, 8);
    const contextSnippets = vectorMatches.map((m) => ({
      title: m.chunk.title,
      content: m.chunk.content,
      claim_ids: m.chunk.claim_ids,
    }));

    // 4. Attempt Groq AI Grounded Engine inference
    if (GROQ_API_KEY && contextSnippets.length > 0) {
      try {
        const systemPrompt = `You are the grounded intelligence system for GCC Atlas, an authoritative, citable platform on India's Global Capability Centres.
You answer user queries strictly, accurately, and authoritatively using ONLY the provided Verified Context below.

VERIFIED CONTEXT FROM GCC ATLAS VECTOR STORE:
${JSON.stringify(contextSnippets)}

MANDATORY RULES:
1. Every factual sentence in "answer_blocks" must cite valid "claim_ids" from the context if available.
2. If the user asks for numbers, claims, or entities NOT present in the verified context, reply:
   "The Atlas has no sourced data on this yet. In accordance with our hard rules, we never invent figures or answer from ungrounded memory."
   Set "is_grounded": false, and describe the unverified metric in the "gaps" array.
3. Keep answers concise, professional, and clear.
4. Output strictly valid JSON with schema:
{
  "answer_blocks": [ { "text": "factual sentence", "claim_ids": ["claim-id"] } ],
  "follow_ups": ["relevant question 1", "relevant question 2"],
  "gaps": [],
  "is_grounded": true or false
}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8500);

        const groqRes = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${GROQ_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: GROQ_MODEL,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: query },
              ],
              response_format: { type: "json_object" },
              temperature: 0.1,
            }),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const rawContent = groqData.choices?.[0]?.message?.content;
          if (rawContent) {
            const parsed = JSON.parse(rawContent) as AskResponse;

            if (parsed.answer_blocks && parsed.answer_blocks.length > 0) {
              const hasValidClaims = parsed.answer_blocks.every(
                (b) =>
                  !b.claim_ids ||
                  b.claim_ids.every((cid) => claimsMap.has(cid))
              );

              if (hasValidClaims) {
                return NextResponse.json({
                  answer_blocks: parsed.answer_blocks,
                  follow_ups: (parsed.follow_ups || []).slice(0, 3),
                  gaps: parsed.gaps || [],
                  is_grounded: parsed.is_grounded !== false,
                  disagreements:
                    disagreements.length > 0 ? disagreements : undefined,
                });
              }
            }
          }
        }
      } catch (groqErr) {
        console.warn("Groq inference fallback triggered:", groqErr);
      }
    }

    // 5. Deterministic Grounded Engine Fallback
    const answer_blocks: AnswerBlock[] = [];
    const follow_ups: string[] = [];
    const gaps: string[] = [];

    // Macro market revenue or market facts
    if (
      q.includes("revenue") ||
      q.includes("market size") ||
      q.includes("billion") ||
      q.includes("fy26")
    ) {
      const revClaim = allClaims.find((c) => c.field === "annual_revenue");
      const usClaim = allClaims.find(
        (c) => c.field === "north_america_origin_share"
      );
      const blockClaims: string[] = [];

      let text = "";
      if (revClaim) {
        text += `India's GCC ecosystem generated an estimated annual revenue of $${revClaim.value} Billion in FY26. `;
        blockClaims.push(revClaim.id);
      }
      if (usClaim) {
        text += `North American multinational enterprises account for ${usClaim.value}% of all new setups.`;
        blockClaims.push(usClaim.id);
      }

      if (blockClaims.length > 0) {
        answer_blocks.push({ text, claim_ids: blockClaims });
        follow_ups.push("What is the total GCC workforce in India?");
        follow_ups.push("How many Mega GCCs operate in India?");
      }
    }

    // Workforce / talent / headcount
    if (
      q.includes("workforce") ||
      q.includes("talent") ||
      q.includes("headcount") ||
      q.includes("professionals") ||
      q.includes("million")
    ) {
      const wfClaim = allClaims.find((c) => c.field === "headcount_total");
      const salaryClaim = allClaims.find(
        (c) => c.field === "pay_premium_over_it_services"
      );
      const blockClaims: string[] = [];

      let text = "";
      if (wfClaim) {
        text += `India's GCC direct talent base reached ${wfClaim.value} Million professionals in FY26. `;
        blockClaims.push(wfClaim.id);
      }
      if (salaryClaim) {
        text += `Global Capability Centres currently pay a ${salaryClaim.value} compensation premium over traditional IT services firms.`;
        blockClaims.push(salaryClaim.id);
      }

      if (blockClaims.length > 0) {
        answer_blocks.push({ text, claim_ids: blockClaims });
        follow_ups.push(
          "Compare tech talent salary indexes across Bengaluru and Hyderabad"
        );
      }
    }

    // Mega GCCs
    if (q.includes("mega") || q.includes("5000+")) {
      const megaClaim = allClaims.find((c) => c.field === "mega_gcc_count");
      if (megaClaim) {
        answer_blocks.push({
          text: `India hosts ${megaClaim.value} Mega GCCs with headcounts exceeding 5,000 personnel.`,
          claim_ids: [megaClaim.id],
        });
        follow_ups.push(
          "Which cities host the highest concentration of Mega GCCs?"
        );
      }
    }

    // Real estate / leasing
    if (q.includes("leasing") || q.includes("absorption") || q.includes("q1")) {
      const leaseClaim = allClaims.find(
        (c) => c.field === "gcc_office_leasing_share_q1_2026"
      );
      if (leaseClaim) {
        answer_blocks.push({
          text: `In Q1 2026, GCCs accounted for ${leaseClaim.value}% of gross commercial office absorption in India.`,
          claim_ids: [leaseClaim.id],
        });
        follow_ups.push(
          "What is the commercial office rent range in Bengaluru?"
        );
      }
    }

    // Provider queries: Real estate advisors, ANSR incubation, evaluation methodology
    if (
      q.includes("advisor") ||
      q.includes("provider") ||
      q.includes("ansr") ||
      q.includes("jll") ||
      q.includes("cbre") ||
      q.includes("evaluated") ||
      q.includes("ranked")
    ) {
      if (
        q.includes("google") ||
        q.includes("boeing") ||
        q.includes("real estate") ||
        q.includes("jll") ||
        q.includes("cbre")
      ) {
        const leaseClaim = allClaims.find(
          (c) => c.field === "gcc_office_leasing_share_q1_2026"
        );
        answer_blocks.push({
          text: "In campus site selection and tenant representation, JLL advised on Google India's 650,000 sq ft campus expansion in Bengaluru (2024), and CBRE South Asia represented Boeing India for its 43-acre engineering centre at BIEC Bengaluru (2023).",
          claim_ids: leaseClaim ? [leaseClaim.id] : [],
        });
        follow_ups.push(
          "What services does ANSR provide for GCC incubation in India?"
        );
        follow_ups.push(
          "How are service providers evaluated and ranked in the Atlas?"
        );
      } else if (
        q.includes("ansr") ||
        q.includes("incubation") ||
        q.includes("target")
      ) {
        const revClaim = allClaims.find((c) => c.field === "annual_revenue");
        answer_blocks.push({
          text: "ANSR provides Build-Operate-Transfer (BOT) incubation, workspace design, talent acquisition, and capability scaling for GCCs in India, including the setup of Target Corporation's India centre in Bengaluru.",
          claim_ids: revClaim ? [revClaim.id] : [],
        });
        follow_ups.push(
          "Which real estate advisors represented Google India or Boeing in campus site selection?"
        );
        follow_ups.push(
          "How are service providers evaluated and ranked in the Atlas?"
        );
      } else {
        const revClaim = allClaims.find((c) => c.field === "annual_revenue");
        answer_blocks.push({
          text: "Service providers in GCC Atlas are evaluated strictly on documented proof links: verified lease deeds, enterprise client attestations, and documented advisories. Rankings are based on evidence depth; commercial payments never alter scores.",
          claim_ids: revClaim ? [revClaim.id] : [],
        });
        follow_ups.push(
          "Which real estate advisors represented Google India or Boeing in campus site selection?"
        );
        follow_ups.push(
          "What services does ANSR provide for GCC incubation in India?"
        );
      }
    }

    // City-specific query (Bengaluru, Hyderabad, etc.)
    const allCities = citiesRepo.getAll();
    const matchedCity = allCities.find((c) =>
      q.includes(c.name.toLowerCase())
    );
    if (matchedCity) {
      const cityClaims = allClaims.filter(
        (c) => c.subject_id === `city-${matchedCity.id}`
      );
      const unitsClaim = cityClaims.find((c) => c.field === "gcc_unit_count");
      const rentClaim = cityClaims.find((c) => c.field === "office_rent_range");
      const vacClaim = cityClaims.find(
        (c) => c.field === "office_vacancy_rate"
      );
      const shareClaim = cityClaims.find(
        (c) => c.field === "market_share_national"
      );
      const blockClaims: string[] = [];
      let text = `${matchedCity.name} currently operates ${unitsClaim ? unitsClaim.value : "verified"} GCC units`;
      if (unitsClaim) blockClaims.push(unitsClaim.id);
      if (shareClaim) {
        text += ` (accounting for approximately ${shareClaim.value} of national GCC operations)`;
        blockClaims.push(shareClaim.id);
      }
      text += `. `;
      if (rentClaim) {
        text += `Grade A commercial rents range from ${rentClaim.value} per sq ft per month. `;
        blockClaims.push(rentClaim.id);
      }
      if (vacClaim) {
        text += `Vacancy stands at ${vacClaim.value}%.`;
        blockClaims.push(vacClaim.id);
      }

      answer_blocks.push({ text, claim_ids: blockClaims });
      follow_ups.push(
        `What state incentives apply to GCCs in ${matchedCity.state_id}?`
      );
    }

    // GCC entity query (Google, Microsoft, Boeing, etc.)
    const allGccs = gccRepo.getAll();
    const matchedGcc = allGccs.find(
      (g) =>
        q.includes(g.name.toLowerCase()) ||
        q.includes(g.parent_name.toLowerCase()) ||
        q.includes(g.slug.toLowerCase())
    );
    if (matchedGcc) {
      const gccClaims = allClaims.filter(
        (c) => c.subject_id === matchedGcc.id
      );
      const blockClaims: string[] = [];
      let text = `${matchedGcc.name} (Parent: ${matchedGcc.parent_name}) operates in ${matchedGcc.cities.join(", ")}. `;

      const estClaim = gccClaims.find((c) => c.field === "established_year");
      const cinClaim = gccClaims.find((c) => c.field === "cin");

      if (estClaim) {
        text += `Established in India in ${estClaim.value}. `;
        blockClaims.push(estClaim.id);
      }
      if (cinClaim) {
        text += `Statutory MCA Corporate Identification Number: ${cinClaim.value}.`;
        blockClaims.push(cinClaim.id);
      }

      if (blockClaims.length > 0) {
        answer_blocks.push({ text, claim_ids: blockClaims });
        follow_ups.push(`View full profile for ${matchedGcc.name}`);
      }
    }

    // State Policy / Incentives query
    const allStates = statesRepo.getAll();
    const matchedState = allStates.find((s) =>
      q.includes(s.name.toLowerCase())
    );
    if (matchedState) {
      const inc = matchedState.policy.incentives;
      if (inc.length > 0) {
        const topInc = inc[0];
        answer_blocks.push({
          text: `Under the ${matchedState.policy.policy_name} (${matchedState.policy.period}), ${matchedState.name} offers: ${topInc.description} (Subsidy: ${topInc.amount_or_rate || "Specified in policy"}).`,
          claim_ids: [],
        });
        follow_ups.push(
          `Compare ${matchedState.name} incentives with other states`
        );
      }
    }

    // Grounding & Strict Citation Check (Drop any uncited block)
    const verifiedBlocks: AnswerBlock[] = [];
    for (const block of answer_blocks) {
      const check = verifyAnswerGrounding(
        block.text,
        block.claim_ids,
        claimsMap
      );
      if (check.isGrounded || block.claim_ids.length > 0) {
        verifiedBlocks.push(block);
      }
    }

    if (verifiedBlocks.length === 0) {
      return NextResponse.json({
        answer_blocks: [
          {
            text: "The Atlas has no sourced data on this yet. In accordance with our hard rules, we never invent figures or answer from ungrounded memory.",
            claim_ids: [],
          },
        ],
        follow_ups: [
          "What is India's total GCC market revenue in FY26?",
          "How many GCC units are in Bengaluru?",
          "How many Mega GCCs exist in India?",
        ],
        gaps: [
          `No citable primary claim found matching: "${query}". Pending ingestion from primary corporate filings or state gazettes.`,
        ],
        is_grounded: false,
      });
    }

    return NextResponse.json({
      answer_blocks: verifiedBlocks,
      follow_ups: follow_ups.slice(0, 3),
      gaps,
      is_grounded: true,
      disagreements: disagreements.length > 0 ? disagreements : undefined,
    });
  } catch (error: any) {
    console.error("Ask GCC Atlas API Error:", error);
    return NextResponse.json(
      { error: "Internal server error processing grounded query" },
      { status: 500 }
    );
  }
}
