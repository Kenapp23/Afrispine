/**
 * AfriSpine Digest — Seed Script
 * Creates sample digest issues (#44-#47), stories, sponsors, subscribers, and advertisers.
 * Idempotent: skips records that already exist.
 *
 * Run: npx tsx scripts/seed-digest.ts
 */

import { db } from '../src/lib/db';

// ─── Date helpers ──────────────────────────────────────────────

function getIssueDate(weeksAgo: number): Date {
  // Each issue publishes on Thursday
  const d = new Date();
  const dayOfWeek = d.getDay();
  const diff = dayOfWeek === 0 ? -3 : dayOfWeek - 4; // Thursday
  const thursday = new Date(d);
  thursday.setDate(d.getDate() - diff - weeksAgo * 7);
  thursday.setHours(7, 0, 0, 0);
  return thursday;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

// ─── Issue data ────────────────────────────────────────────────

interface IssueData {
  issueNumber: number;
  slug: string;
  subject: string;
  coverHeadline: string;
  stories: StoryData[];
  sponsor: {
    sponsorName: string;
    adHeadline: string;
    adBody: string;
    adCtaText: string;
    adCtaUrl: string;
  };
}

interface StoryData {
  section: string;
  title: string;
  subtitle: string;
  bodyHtml: string;
  readTime: number;
  sortOrder: number;
  meta: string;
}

// ─── Issue #47 (Current / Latest) ──────────────────────────────

const ISSUE_47: IssueData = {
  issueNumber: 47,
  slug: 'issue-47-energy-markets-and-the-diaspora-dollar',
  subject: 'AfriSpine Digest #47 — Energy, Markets, and the Diaspora Dollar',
  coverHeadline: "Dangote's Billion-Dollar Bet on African Energy",
  stories: [
    // ─── Cover Story ───────────────────────────────────────────
    {
      section: 'cover_story',
      title: "Dangote's Billion-Dollar Bet on African Energy",
      subtitle: 'How the Dangote Refinery is reshaping Africa\'s energy independence — and what it means for investors watching from abroad.',
      bodyHtml: `<p><strong>Lagos, Nigeria</strong> — Standing on the sprawling 2,635-hectare complex on the outskirts of Lagos, it is hard not to feel the sheer scale of what Aliko Dangote has built. The Dangote Petroleum Refinery, the largest single-train refinery in the world, began full operations in early 2025, and its ripple effects are already being felt across African capital markets.</p>

<p>For decades, Nigeria — Africa's largest oil producer — paradoxically imported nearly all of its refined petroleum products. The irony was staggering: a nation sitting on 37 billion barrels of proven crude reserves could not produce enough petrol to keep its own generators running. <strong>Dangote Refinery has ended that era</strong>, and the market is paying attention.</p>

<h3>A Market-Moving Asset</h3>

<p>Since the refinery reached full capacity of 650,000 barrels per day, Dangote Cement's stock on the NGX has surged 12.3%, while Dangote Sugar Refinery climbed 8.7%. The market is pricing in something fundamental: <strong>Africa's largest economy is no longer bleeding foreign exchange on fuel imports.</strong></p>

<blockquote>"This is the single most important infrastructure project in sub-Saharan Africa since the construction of the Aswan Dam. It changes the macroeconomic calculus for Nigeria and every country that depends on Nigerian refined products." — Dr. Akinwumi Adesina, President, African Development Bank</blockquote>

<p>The numbers tell the story. Nigeria spent $23.3 billion on petroleum imports in 2023 alone. With the Dangote Refinery now supplying the domestic market and exporting to neighbouring West African nations, the Central Bank of Nigeria estimates that <strong>foreign exchange savings could exceed $18 billion annually</strong>. For diaspora investors tracking the Naira, this is a structural shift, not a temporary blip.</p>

<h3>The Investment Angle</h3>

<p>For the African diaspora investor, the implications are multilayered. First, reduced fuel import pressure should strengthen the Naira over the medium term, meaning remittances sent home will go further. Second, the refinery's success validates a thesis that many diaspora investors have long believed: <em>Africa's best investment opportunities are in infrastructure that reduces import dependency.</em></p>

<p>"I've been telling my network in London for three years: watch what Dangote does with that refinery," says <strong>Chidi Okafor</strong>, a Nigerian-British fund manager at a London-based emerging markets desk. "When a single project can change a country's current account by $18 billion, you don't need complex financial models to see the opportunity."</p>

<p>The refinery is also creating downstream opportunities. Dangote Fertiliser, which shares the same industrial complex, is already supplying farmers across West Africa and has seen its revenue double year-over-year. Analysts at Stanbic IBTC project that the combined Dangote industrial complex could contribute <strong>up to 4.2% of Nigeria's GDP by 2027</strong>.</p>

<h3>What Diaspora Investors Should Watch</h3>

<p>The Dangote Refinery is not a publicly traded entity — it remains privately held within the Dangote Group. However, the publicly listed Dangote Cement (NGX: DANGCEM) and Dangote Sugar (NGX: DANGSUGAR) serve as proxy plays. More broadly, the refinery's success strengthens the investment case for Nigerian equities, infrastructure bonds, and the Naira itself.</p>

<p>For now, the message from Lagos is clear: <strong>Africa is building, and the world is finally noticing.</strong></p>`,
      readTime: 6,
      sortOrder: 1,
      meta: '{}',
    },

    // ─── Market Pulse ───────────────────────────────────────────
    {
      section: 'market_pulse',
      title: "Africa's Markets Rally as Global Investors Eye Continent",
      subtitle: 'Weekly exchange performance data across Africa\'s major bourses.',
      bodyHtml: `<p>African equities posted strong gains this week as a combination of favourable macroeconomic data and renewed foreign investor interest lifted markets across the continent. Five of the six tracked exchanges closed in positive territory.</p>

<h3>Exchange Performance</h3>

<p><strong>Nigerian Exchange Group (NGX)</strong> led the rally with a <strong>+2.3%</strong> gain, driven by banking stocks and the Dangote conglomerate. Zenith Bank (+4.1%) and GTCO (+3.7%) were the standout performers as the CBN's new forex window attracted portfolio inflows.</p>

<p><strong>Nairobi Securities Exchange (NSE)</strong> rose <strong>+1.8%</strong>, with Safaricom continuing its upward momentum after announcing a special dividend. The telecommunications sector now accounts for 42% of the NSE's total market capitalisation.</p>

<p><strong>Ghana Stock Exchange (GSE)</strong> was the surprise outperformer, gaining <strong>+3.1%</strong> as the Bank of Ghana's inflation targeting regime showed results — CPI fell to 18.2% in May, down from 23.5% at the start of the year. GCB Bank and Ecobank Ghana were the primary beneficiaries.</p>

<p><strong>BRVM</strong> (Bourse Régionale des Valeurs Mobilières) posted a modest <strong>+0.9%</strong> gain, with Ivorian and Senegalese financials leading. SIB (Banque de l'Habitat) rose 2.8%.</p>

<p><strong>Johannesburg Stock Exchange (JSE)</strong> was the sole decliner at <strong>-0.4%</strong>, weighed down by mining stocks as commodity prices softened. Anglo American fell 3.2% on weaker platinum group metal prices.</p>

<blockquote>"The narrative is shifting. Global investors are no longer asking 'why Africa?' — they're asking 'which Africa?'" — Ravi Bhatia, Head of Africa Research, Standard Chartered</blockquote>

<h3>Top Movers</h3>

<p><strong>Gainers:</strong> SCOM (Safaricom, NSE) +4.2% | GTCO (Guaranty Trust, NGX) +3.7% | GCB (GCB Bank, GSE) +6.8%</p>
<p><strong>Losers:</strong> DTM (Dangote Sugar, NGX) -2.1% | ANG (Anglo American, JSE) -3.2% | EBG (Ecobank Ghana, GSE) -4.1%</p>

<h3>FX Rates</h3>

<p><strong>GBP/KES:</strong> 192.50 (+0.3% WoW) | <strong>USD/NGN:</strong> 1,580.00 (-1.2% WoW, Naira strengthening) | <strong>USD/GHS:</strong> 15.20 (stable)</p>

<p>The Naira's continued appreciation reflects the Dangote Refinery's impact on fuel import demand and the CBN's improved liquidity management. Diaspora remitters are seeing measurably better rates compared to Q1 2025.</p>`,
      readTime: 5,
      sortOrder: 2,
      meta: JSON.stringify({
        exchanges: [
          { name: 'NGX', country: 'NG', change: 2.3 },
          { name: 'NSE', country: 'KE', change: 1.8 },
          { name: 'JSE', country: 'ZA', change: -0.4 },
          { name: 'GSE', country: 'GH', change: 3.1 },
          { name: 'BRVM', country: 'FR', change: 0.9 },
        ],
        topGainers: [{ ticker: 'SCOM', name: 'Safaricom', change: 4.2 }],
        topLosers: [{ ticker: 'DTM', name: 'Dangote Sugar', change: -2.1 }],
        fxRates: {
          'GBP/KES': '192.50',
          'USD/NGN': '1580.00',
          'USD/GHS': '15.20',
        },
      }),
    },

    // ─── Company Spotlight ──────────────────────────────────────
    {
      section: 'company_spotlight',
      title: 'Safaricom: How Africa\'s Most Profitable Telecom Built an Empire on Trust',
      subtitle: 'From a single cell tower in Nairobi to a KES 1 trillion market cap — the Safaricom story is the story of Kenya itself.',
      bodyHtml: `<p>In 2000, Safaricom was a struggling joint venture between the Kenyan government and Vodafone, serving just 20,000 subscribers. Today, it is <strong>Africa's most profitable telecommunications company</strong>, with over 45 million subscribers, a market capitalisation exceeding KES 1 trillion, and a brand recognition that rivals Coca-Cola on the African continent.</p>

<p>But Safaricom's story is not about technology — it is about <strong>trust</strong>. And for diaspora investors trying to understand which African companies will endure, it is a masterclass in building something that lasts.</p>

<h3>M-Pesa: The Revolution That Changed Everything</h3>

<p>When M-Pesa launched in 2007, the concept was radical: allow people to send money using their mobile phones, without a bank account. The product was designed for the unbanked — farmers in Kisumu, market women in Mombasa, boda boda riders in Nairobi's estates. <strong>Within 18 months, M-Pesa had 2 million users. Within five years, it was processing transactions equivalent to 20% of Kenya's GDP.</strong></p>

<blockquote>"We didn't build M-Pesa for the wealthy. We built it for my grandmother in the village. And that's why it worked — because we solved a real problem for real people." — former Safaricom CEO Peter Ndegwa</blockquote>

<p>For the diaspora, M-Pesa was transformative. Kenyans working in London, Dubai, and Minneapolis could send money home instantly, bypassing the slow and expensive traditional remittance corridors. <strong>AfriSpine itself was born from this diaspora-M-Pesa nexus</strong> — recognising that the trust Safaricom built on the ground was the same trust diaspora communities needed to feel confident investing back home.</p>

<h3>The Financials: Why Investors Keep Buying</h3>

<p>Safaricom's numbers are remarkable. The company consistently delivers <strong>operating margins above 35%</strong>, a feat virtually unheard of in global telecoms. Its dividend yield of 5.8% makes it one of the highest-yielding blue-chip stocks on any African exchange. The P/E ratio of 15.2x may look modest, but analysts argue the growth runway — particularly in Ethiopia and the broader East African Community — justifies a premium.</p>

<p>Revenue for FY2024 hit KES 310 billion, with M-Pesa contributing 42% of total service revenue. The fintech arm alone processes over KES 7 trillion in transactions annually — more than Kenya's entire government budget.</p>

<h3>What's Next: Ethiopia and Beyond</h3>

<p>Safaricom's entry into Ethiopia — Africa's second most populous nation with 120 million people — is the company's boldest bet yet. The Ethiopian telecom market was a state monopoly for decades, and Safaricom Ethiopia is now competing head-to-head with Ethio Telecom. Early subscriber numbers are encouraging: <strong>3.2 million subscribers within the first 18 months of operation</strong>.</p>

<p>"Ethiopia is the single largest greenfield telecom opportunity in the world," says <strong>Wanjiru Kamau</strong>, a Nairobi-based equity analyst at Renaissance Capital. "If Safaricom captures even 20% of the Ethiopian market, it adds a potential KES 50 billion to their revenue base. That's transformative."</p>

<p>For diaspora investors, Safaricom remains the quintessential African investment: <em>a company that understands its customers, delivers consistent returns, and is still growing.</em></p>`,
      readTime: 7,
      sortOrder: 3,
      meta: JSON.stringify({
        ticker: 'SCOM',
        exchange: 'NSE',
        pe: 15.2,
        dividendYield: 5.8,
        price: 25.75,
        marketCap: '1.02T KES',
      }),
    },

    // ─── Opportunity ────────────────────────────────────────────
    {
      section: 'opportunity',
      title: 'Kenya Infrastructure Bond Yield Hits 14.25% Tax-Free',
      subtitle: 'The Central Bank of Kenya\'s latest infrastructure offering delivers one of the best risk-adjusted returns on the continent.',
      bodyHtml: `<p>The Central Bank of Kenya has opened subscription for its latest <strong>5-year Infrastructure Bond</strong> (IFB 3/2025), and the yield is turning heads across the diaspora investment community. At <strong>14.25% per annum, tax-free for Kenyan residents</strong>, this bond offers what many analysts describe as the best risk-adjusted sovereign return available in sub-Saharan Africa.</p>

<h3>The Details</h3>

<p><strong>Type:</strong> Fixed-rate infrastructure bond<br/>
<strong>Yield:</strong> 14.25% p.a. (tax-exempt for residents)<br/>
<strong>Tenor:</strong> 5 years (maturity: June 2030)<br/>
<strong>Minimum Investment:</strong> KES 50,000 (~GBP 260 / ~USD 330)<br/>
<strong>Risk Rating:</strong> Low (sovereign guarantee)<br/>
<strong>Coupon Payments:</strong> Semi-annual (June and December)</p>

<blockquote>"At 14.25% tax-free, you're effectively earning the equivalent of a 20%+ taxable yield in the UK. For diaspora investors, this is genuinely hard to beat on a risk-adjusted basis." — Kevin Ombati, CFA, Senior Analyst, Cytonn Investments</blockquote>

<h3>Why This Bond Stands Out</h3>

<p>Infrastructure bonds issued by the Kenyan government are backed by the full faith and credit of the Republic of Kenya. The proceeds fund road construction, water projects, and energy infrastructure — tangible assets that drive economic growth. Unlike corporate bonds, <strong>the default risk is minimal</strong> for an economy growing at 5.4% annually with a diversified GDP base.</p>

<p>The tax-free status is particularly significant. A UK-based investor in the 40% tax bracket earning 5% on a gilt would need to find a <strong>pre-tax equivalent of 8.3%</strong> to match the after-tax return of Kenya's 14.25% infrastructure bond. The math is compelling.</p>

<h3>How Diaspora Investors Can Participate</h3>

<p>Kenyans abroad can purchase infrastructure bonds through the <strong>CBK Treasury Mobile Direct (TMD)</strong> platform via M-Pesa, or through licensed investment banks such as KCB Capital, NCBA, and Stanbic. The AfriSpine platform is also exploring integrated bond purchase capabilities for its verified users.</p>

<p><strong>Subscription closes: 19 June 2025.</strong> With yields expected to decline as inflation moderates, this may represent the last opportunity to lock in double-digit returns on Kenyan sovereign debt for the foreseeable future.</p>`,
      readTime: 5,
      sortOrder: 4,
      meta: JSON.stringify({
        type: 'bond',
        yield: '14.25%',
        tenor: '5 years',
        minimum: 'KES 50,000',
        risk: 'Low',
      }),
    },

    // ─── Diaspora Story ─────────────────────────────────────────
    {
      section: 'diaspora_story',
      title: 'The Kenyan Nurse in Glasgow Who Now Owns 5,000 Safaricom Shares',
      subtitle: 'Grace Wambui\'s journey from NHS night shifts to building a portfolio of African equities — one M-Pesa transfer at a time.',
      bodyHtml: `<p><strong>Glasgow, Scotland</strong> — Grace Wambui finishes her night shift at the Queen Elizabeth University Hospital at 7:30 AM, takes the bus home to her flat in the Southside, and does something that most of her colleagues would find unusual: she opens her investment app and checks the Nairobi Securities Exchange.</p>

<p>"My friends here invest in ISAs and pension funds," Grace says with a warm laugh, pouring herself a cup of Kenyan chai. "And I do too — I have my NHS pension. But my heart, and a good chunk of my savings, are invested back home."</p>

<h3>From Nakuru to Glasgow</h3>

<p>Grace left Nakuru in 2016, recruited by the NHS as part of a programme to address the UK's nursing shortage. She was 29, with two young children and a husband who would follow six months later. The adjustment was brutal — Scottish winters, 12-hour shifts, and the aching loneliness of being 7,000 kilometres from everything familiar.</p>

<p>"The first year, I cried every single day," she admits. "Not because Scotland was bad — the people were wonderful. But I missed my mother, I missed the smell of rain on red soil, I missed hearing Swahili in the streets."</p>

<blockquote>"When I sent my first KES 10,000 home through M-Pesa and my mother called me crying with gratitude — that's when I understood that this connection I had to Kenya wasn't just emotional. It was financial, and it was powerful." — Grace Wambui</blockquote>

<h3>The Investing Epiphany</h3>

<p>Grace's investment journey began in 2019 when a cousin in Nairobi mentioned that Safaricom was trading at KES 17 and paying a 6% dividend. "I thought, wait — I'm sending money home anyway. What if instead of just sending it, I bought shares?"</p>

<p>She started small: KES 5,000 worth of Safaricom shares through her cousin's broker account. Then another KES 5,000 the next month. And the month after that. Within three years, she had accumulated <strong>5,000 shares of Safaricom</strong>, purchased at an average price of KES 19. At the current price of KES 25.75, her portfolio is worth KES 128,750 — a gain of over 35% plus two years of dividends.</p>

<h3>The Power of Diaspora Capital</h3>

<p>Grace is not alone. Across the UK, US, and Gulf states, thousands of Kenyan professionals are discovering that investing in African equities through diaspora-friendly platforms offers returns that rival — and often exceed — what they can achieve in their countries of residence.</p>

<p>"My Safaricom shares have outperformed my UK ISA every single year since 2020," Grace says. "And the dividends — I send those straight to my mother's M-Pesa. It's a cycle. I invest in Kenya, Kenya pays me back, and my family benefits. <strong>That's the diaspora dollar at work.</strong>"</p>

<p>She pauses, looks out the window at the grey Glasgow sky, and smiles. "One day, I'll go home. And when I do, I'll have more than memories. I'll have a stake in the country's future."</p>`,
      readTime: 7,
      sortOrder: 5,
      meta: '{}',
    },

    // ─── Podcast ────────────────────────────────────────────────
    {
      section: 'podcast',
      title: 'Weekly Briefing: Energy, Markets, and the Diaspora Dollar',
      subtitle: 'This week on the AfriSpine Podcast: the Dangote Refinery effect, NGX rally analysis, and why infrastructure bonds are the hottest ticket in Nairobi.',
      bodyHtml: `<p><strong>Episode 47</strong> — Join host <strong>Adaeze Okonkwo</strong> and this week's guest analyst <strong>Mutua Kilonzo</strong>, Head of Research at ABC Capital (Nairobi), for a deep dive into the stories shaping African markets this week.</p>

<h3>In This Episode</h3>

<p><strong>00:00</strong> — Intro: What the Dangote Refinery means for the Naira and your remittances<br/>
<strong>06:30</strong> — Market Pulse: Why 4 of 5 African exchanges rallied this week<br/>
<strong>14:15</strong> — Deep Dive: Safaricom's trust-based empire and Ethiopia entry<br/>
<strong>22:00</strong> — Bond Desk: Kenya's 14.25% infrastructure bond — last chance for double-digit yields?<br/>
<strong>29:45</strong> — Diaspora Story: Grace Wambui's journey from Glasgow nurse to Nairobi investor<br/>
<strong>36:00</strong> — Quick Takes: MTN fintech, Equity Bank's diaspora play, Jumia's Q1 surprise<br/>
<strong>42:00</strong> — Numbers of the Week and Outro</p>

<p><em>New episodes drop every Thursday at 06:00 GMT.</em></p>

<blockquote>"The diaspora is not just sending money home anymore — they're sending capital, expertise, and expectations. That changes everything." — Mutua Kilonzo, ABC Capital</blockquote>

<p><strong>Listen on:</strong> Apple Podcasts · Spotify · YouTube · afri-spine.com/podcast</p>`,
      readTime: 3,
      sortOrder: 6,
      meta: '{}',
    },
  ],
  sponsor: {
    sponsorName: 'KCB Bank',
    adHeadline: 'Earn 12% on Diaspora Savings',
    adBody: 'KCB Diaspora Savings Account — earn 12% p.a. interest, access your funds via M-Pesa, and invest in Kenyan bonds and equities from anywhere in the world. No minimum balance. FDIC-equivalent deposit protection up to KES 4 million.',
    adCtaText: 'Open Account',
    adCtaUrl: 'https://kcbgroup.com/diaspora',
  },
};

// ─── Issue #46 ─────────────────────────────────────────────────

const ISSUE_46: IssueData = {
  issueNumber: 46,
  slug: 'issue-46-mtn-fintech-and-the-ngx-opportunity',
  subject: 'AfriSpine Digest #46 — MTN\'s Fintech Play and the NGX Opportunity',
  coverHeadline: "MTN's Pan-African Fintech Play: What It Means for Diaspora Investors",
  stories: [
    // ─── Cover Story ───────────────────────────────────────────
    {
      section: 'cover_story',
      title: "MTN's Pan-African Fintech Play: What It Means for Diaspora Investors",
      subtitle: 'Africa\'s largest telecom is betting big on financial services — and the stock market is taking notice.',
      bodyHtml: `<p><strong>Johannesburg, South Africa</strong> — When MTN Group CEO Ralph Mupita took the stage at the company's annual results presentation in March 2025, he didn't lead with subscriber numbers. He led with fintech. "In five years, MTN will earn more from financial services than from voice and data combined," Mupita declared. The room fell silent — then the stock rose 3.8% in a single session.</p>

<p>MTN's transformation from a traditional telecom to a <strong>pan-African financial services platform</strong> is arguably the most significant strategic shift in African corporate history. With 290 million subscribers across 21 countries, MTN's mobile money platform — MTN MoMo — processed <strong>$32 billion in transactions in 2024</strong>, a 45% increase from the prior year.</p>

<h3>Why This Matters for Diaspora Investors</h3>

<p>For the African diaspora, MTN's fintech play is personal. MTN MoMo is the channel through which millions of people send and receive money across borders. In markets like Uganda, Ghana, and Cameroon, <strong>MTN MoMo is more widely used than traditional bank accounts</strong>. The platform's cross-border capabilities are particularly relevant for diaspora communities who need to move money quickly and cheaply.</p>

<blockquote>"MTN is building the rails of African financial infrastructure. If you're a diaspora investor asking 'how do I invest in Africa's digital payments revolution?', the answer might be simpler than you think: buy MTN." — Yolande D'Mello, Fintech Analyst, Exotix Capital</blockquote>

<p>The company's share price on the JSE has appreciated 28% over the past 12 months, and analysts at JPMorgan recently initiated coverage with an "overweight" rating, citing MTN's fintech revenue trajectory as the primary catalyst.</p>

<h3>The MoMo Super App</h3>

<p>MTN's latest weapon is the MoMo Super App, which aggregates mobile money, savings, lending, insurance, and merchant payments into a single platform. Launched initially in Ghana and Uganda, the app already has <strong>18 million active users</strong> across its launch markets.</p>

<p>"The Super App is MTN's answer to the question every African fintech startup is trying to solve," says <strong>Kwame Asante</strong>, a Ghanaian-British venture capitalist. "Can you build a single platform that handles all of a person's financial life? MTN has the distribution, the brand, and the regulatory licences. They might actually pull it off."</p>

<p>For diaspora investors, MTN Group (JSE: MTN) represents a rare opportunity to own a piece of Africa's digital infrastructure — not through a risky startup, but through a <strong>blue-chip company generating $15 billion in annual revenue</strong> with a clear path to higher-margin financial services earnings.</p>`,
      readTime: 6,
      sortOrder: 1,
      meta: '{}',
    },

    // ─── Market Pulse ───────────────────────────────────────────
    {
      section: 'market_pulse',
      title: 'Markets Mixed as Nigeria Leads Gains, South Africa Lags',
      subtitle: 'Weekly exchange performance: NGX rallies on banking sector strength while JSE faces commodity headwinds.',
      bodyHtml: `<p>African markets delivered a mixed performance this week as sector-specific dynamics drove divergent outcomes across the continent's major exchanges.</p>

<p><strong>NGX (+2.8%):</strong> The Nigerian Exchange Group posted the strongest gains, led by the banking sector. Access Holdings (+5.2%) and Zenith Bank (+4.3%) rallied on improved Q1 earnings and expectations of further monetary easing by the CBN. The Naira held steady at USD/NGN 1,595.</p>

<p><strong>GSE (+2.4%):</strong> Ghana's market extended its winning streak as inflation data showed continued decline. CPI fell to 19.1%, reinforcing expectations of rate cuts in H2 2025. Benso Oil Palm (+7.2%) was the top performer.</p>

<p><strong>NSE (+1.1%):</strong> Nairobi's market edged higher, with banking stocks providing support. KCB Group (+2.5%) benefited from strong loan growth data. Safaricom was flat ahead of its annual results.</p>

<p><strong>BRVM (+0.5%):</strong> The West African regional exchange posted modest gains. SONATEL (+3.1%) was the standout in Abidjan.</p>

<p><strong>JSE (-1.2%):</strong> Johannesburg fell on weakness in precious metals miners. Gold Fields (-5.4%) and Sibanye Stillwater (-4.8%) dragged the index lower as gold prices corrected from all-time highs.</p>

<blockquote>"The divergence between frontier and developed African markets tells a story: investors are rotating from South African safety into Nigerian and Kenyan growth." — Adesuwa Ekhoe, Portfolio Manager, Fidelity Investments Africa</blockquote>

<p><strong>FX Snapshot:</strong> GBP/KES: 191.20 | USD/NGN: 1,595.00 | USD/GHS: 15.35 | GBP/ZAR: 23.40</p>`,
      readTime: 4,
      sortOrder: 2,
      meta: JSON.stringify({
        exchanges: [
          { name: 'NGX', country: 'NG', change: 2.8 },
          { name: 'NSE', country: 'KE', change: 1.1 },
          { name: 'JSE', country: 'ZA', change: -1.2 },
          { name: 'GSE', country: 'GH', change: 2.4 },
          { name: 'BRVM', country: 'FR', change: 0.5 },
        ],
        topGainers: [{ ticker: 'ACCESS', name: 'Access Holdings', change: 5.2 }],
        topLosers: [{ ticker: 'GFI', name: 'Gold Fields', change: -5.4 }],
        fxRates: {
          'GBP/KES': '191.20',
          'USD/NGN': '1595.00',
          'USD/GHS': '15.35',
        },
      }),
    },

    // ─── Company Spotlight ──────────────────────────────────────
    {
      section: 'company_spotlight',
      title: 'Equity Bank Group — The Bank That Followed Its Customers Home',
      subtitle: 'How Kenya\'s most innovative bank built a diaspora lending empire from the ground up.',
      bodyHtml: `<p><strong>Nairobi, Kenya</strong> — When Dr. James Mwangi, CEO of Equity Group Holdings, speaks about diaspora banking, his voice carries a particular warmth. "Our customers left Kenya with nothing but a dream and a suitcase. We made a promise: <strong>we would follow them wherever they went</strong>."</p>

<p>That promise has translated into one of the most ambitious diaspora banking strategies on the African continent. Equity Bank now has dedicated operations in Kenya, Uganda, Tanzania, Rwanda, South Sudan, DRC, and — critically — <strong>representative offices in London, Dallas, and Dubai</strong> specifically targeting the Kenyan diaspora.</p>

<h3>The Diaspora Mortgage Revolution</h3>

<p>Equity's flagship diaspora product is its <strong>Diaspora Mortgage</strong>, which allows Kenyans abroad to secure mortgage financing for property in Kenya using their foreign income. The product has been transformative: Equity has disbursed over <strong>KES 45 billion ($300 million) in diaspora mortgages</strong> since 2020, financing homes for thousands of Kenyan families.</p>

<blockquote>"I bought my house in Kitengela without ever setting foot in a Kenyan bank branch. I did the entire application on my phone from my flat in Dallas. That's not just convenient — it's revolutionary." — Peter Mwangi, Kenyan software engineer in Dallas, Texas</blockquote>

<h3>Investment Thesis</h3>

<p>Equity Group Holdings (NSE: EQTY) trades at a P/E of 7.8x with a dividend yield of 6.2%. The bank's diaspora deposits have grown 340% in three years, providing a low-cost funding base that supports higher-margin lending. <strong>The stock is up 22% year-to-date</strong>, and analysts see further upside as the diaspora banking division reaches critical mass.</p>`,
      readTime: 6,
      sortOrder: 3,
      meta: JSON.stringify({
        ticker: 'EQTY',
        exchange: 'NSE',
        pe: 7.8,
        dividendYield: 6.2,
        price: 51.30,
        marketCap: '340B KES',
      }),
    },

    // ─── Opportunity ────────────────────────────────────────────
    {
      section: 'opportunity',
      title: 'Nigeria T-Bills: 22% Yield in a High-Rate Environment',
      subtitle: 'Nigeria\'s treasury bills offer extraordinary yields — but is the risk worth it?',
      bodyHtml: `<p>The Central Bank of Nigeria's latest treasury bill auction delivered a <strong>22.15% yield on 364-day T-Bills</strong>, maintaining one of the highest sovereign short-term rates in the world. For diaspora investors with Naira exposure, the question is no longer "is 22% attractive?" — it's "how much Naira risk am I willing to take?"</p>

<h3>The Opportunity</h3>

<p><strong>Yield:</strong> 22.15% p.a. (364-day T-Bill)<br/>
<strong>Minimum:</strong> NGN 50 million (~USD 31,500)<br/>
<strong>Risk:</strong> Moderate (Naira depreciation risk)<br/>
<strong>Liquidity:</strong> Secondary market available</p>

<p>At 22%, a USD 10,000 investment would yield approximately USD 2,215 in a year — <em>if the Naira remained stable</em>. However, the Naira has depreciated an average of 15-20% annually over the past three years, which means the real USD return could be significantly lower.</p>

<blockquote>"The arithmetic of Nigerian T-Bills is a masterclass in emerging market risk-reward. The nominal yield is extraordinary, but the Naira depreciation must be factored in. For investors with natural Naira liabilities — school fees, property maintenance, family support — the net return is much more attractive." — Bola Adesanya, Fixed Income Strategist, Chapel Hill Denham</blockquote>

<p><strong>AfriSpine view:</strong> Nigerian T-Bills are best suited for diaspora investors who already have regular Naira expenses, as the high yield effectively offsets remittance costs and Naira depreciation on their existing liabilities.</p>`,
      readTime: 4,
      sortOrder: 4,
      meta: JSON.stringify({
        type: 'bond',
        yield: '22.15%',
        tenor: '364 days',
        minimum: 'NGN 50,000,000',
        risk: 'Moderate',
      }),
    },

    // ─── Diaspora Story ─────────────────────────────────────────
    {
      section: 'diaspora_story',
      title: 'Why More Nigerians in Houston Are Choosing NGX Stocks Over US 401k',
      subtitle: 'Inside Houston\'s growing Nigerian investment club — where Dangote Cement is more popular than the S&P 500.',
      bodyHtml: `<p><strong>Houston, Texas</strong> — On the first Saturday of every month, a group of 30 Nigerian professionals gathers at a conference room in the Hilton near NASA's Johnson Space Center. They call themselves the <strong>Lone Star Nigerian Investors Club</strong>, and their mission is straightforward: invest in Nigerian equities.</p>

<p>"I max out my 401(k) match at work — that's just common sense," says <strong>Chinedu Eze</strong>, a petroleum engineer at Chevron and one of the club's founding members. "But my 401(k) is for retirement. What I invest in Nigeria is for my future home, my children's inheritance, and my connection to the country that made me who I am."</p>

<h3>The Houston-Nigeria Investment Corridor</h3>

<p>Houston has one of the largest Nigerian communities in the United States — an estimated 150,000 people. Many work in the oil and gas industry, bringing home six-figure salaries and a sophisticated understanding of energy markets. That expertise translates naturally to the NGX, where oil and gas stocks dominate the index.</p>

<blockquote>"We understand Dangote Cement better than the average Wall Street analyst understands Nigerian macroeconomics. We've driven past the plant in Obajana. We know the roads, the power supply, the demand. That local knowledge is our edge." — Adaeze Obi, geologist and club member</blockquote>

<p>The club's portfolio has delivered a <strong>31% return over the past two years</strong>, outperforming both the S&P 500 and the NGX All-Share Index. Their strategy: overweight banking (Zenith, GTCO, Access), hold a core position in Dangote Cement, and allocate 20% to fixed income via Nigerian T-Bills.</p>

<p>"My American colleagues think I'm crazy," says <strong>Funke Alade</strong>, a pharmacist who moved to Houston from Lagos in 2018. "They ask me why I don't just buy index funds. And I tell them: I do. But I also invest where my heart is. And the returns don't hurt."</p>`,
      readTime: 6,
      sortOrder: 5,
      meta: '{}',
    },
  ],
  sponsor: {
    sponsorName: 'Equity Bank',
    adHeadline: 'Your Home. Your Investment. Our Expertise.',
    adBody: 'Equity Bank Diaspora Mortgage — finance your dream home in Kenya from anywhere in the world. Competitive rates from 13.5% p.a., up to 90% financing, and a dedicated diaspora relationship manager. Apply online in 15 minutes.',
    adCtaText: 'Apply Now',
    adCtaUrl: 'https://equitybank.co.ke/diaspora',
  },
};

// ─── Issue #45 ─────────────────────────────────────────────────

const ISSUE_45: IssueData = {
  issueNumber: 45,
  slug: 'issue-45-kenya-budget-ghana-recovery',
  subject: 'AfriSpine Digest #45 — Kenya Budget Season and Ghana\'s Recovery Story',
  coverHeadline: "Kenya's 2025 Budget: What Diaspora Investors Need to Know",
  stories: [
    {
      section: 'cover_story',
      title: "Kenya's 2025 Budget: What Diaspora Investors Need to Know",
      subtitle: 'Treasury CS Prof. Njuguna Ndung\'u unveils a budget that doubles down on infrastructure and digital economy.',
      bodyHtml: `<p>Nairobi's Treasury Building was abuzz this week as Cabinet Secretary Prof. Njuguna Ndung'u presented Kenya's FY2025/2026 budget. The headline figure: <strong>KES 4.2 trillion ($27.5 billion)</strong>, with a record allocation to infrastructure and the digital economy.</p>

<p>For diaspora investors, the budget contained several significant provisions: the introduction of a <strong>Diaspora Investment Tax Incentive</strong> (reduced capital gains tax on investments held for 5+ years), increased funding for the Nairobi-Mombasa Standard Gauge Railway extension, and a new <strong>Digital Economy Fund</strong> aimed at supporting Kenya's tech sector.</p>

<blockquote>"This is the first Kenyan budget that explicitly recognises the diaspora as an investment class, not just a remittance source. It's a watershed moment." — Dr. Patrick Njoroge, former Governor, Central Bank of Kenya</blockquote>

<p>The infrastructure bond programme was expanded to KES 300 billion, with dedicated allocations for affordable housing — a sector that diaspora investors have shown strong interest in through platforms like AfriSpine.</p>`,
      readTime: 4,
      sortOrder: 1,
      meta: '{}',
    },
    {
      section: 'market_pulse',
      title: 'African Markets Rally on Renewed Optimism',
      subtitle: 'All five tracked exchanges posted gains this week in a rare synchronised rally.',
      bodyHtml: `<p>African markets staged a broad-based rally this week, with all five tracked exchanges closing in positive territory. <strong>NGX (+3.1%)</strong> led the gains as banking stocks surged on improved earnings guidance. <strong>NSE (+2.4%)</strong> benefited from strong foreign investor inflows. <strong>GSE (+1.9%)</strong> continued its recovery trajectory. <strong>JSE (+1.2%)</strong> rose on mining sector strength. <strong>BRVM (+0.7%)</strong> posted steady gains.</p>

<p>FX rates remained relatively stable, with the Naira holding at USD/NGN 1,610 and the Shilling at GBP/KES 193.80.</p>`,
      readTime: 3,
      sortOrder: 2,
      meta: JSON.stringify({
        exchanges: [
          { name: 'NGX', country: 'NG', change: 3.1 },
          { name: 'NSE', country: 'KE', change: 2.4 },
          { name: 'JSE', country: 'ZA', change: 1.2 },
          { name: 'GSE', country: 'GH', change: 1.9 },
          { name: 'BRVM', country: 'FR', change: 0.7 },
        ],
        topGainers: [{ ticker: 'ZENITHBANK', name: 'Zenith Bank', change: 5.1 }],
        topLosers: [{ ticker: 'EABL', name: 'East African Breweries', change: -1.8 }],
        fxRates: {
          'GBP/KES': '193.80',
          'USD/NGN': '1610.00',
          'USD/GHS': '15.50',
        },
      }),
    },
    {
      section: 'company_spotlight',
      title: 'GCB Bank: Ghana\'s Resilient Lender Reclaims Its Crown',
      subtitle: 'After years of restructuring, Ghana Commercial Bank is back — and the numbers tell a compelling story.',
      bodyHtml: `<p>GCB Bank, Ghana's largest indigenous bank, has staged a remarkable comeback. After the 2022-2023 domestic debt restructuring that hammered Ghanaian financial institutions, <strong>GCB reported a 45% increase in net profit for Q1 2025</strong>, driven by a surge in lending to the agricultural and energy sectors.</p>

<p>The bank's stock (GSE: GCB) has risen 38% in the past six months, and analysts at Databank see further upside as Ghana's economic recovery gains momentum. The dividend yield of 8.2% makes it one of the highest-yielding bank stocks on any African exchange.</p>`,
      readTime: 3,
      sortOrder: 3,
      meta: JSON.stringify({
        ticker: 'GCB',
        exchange: 'GSE',
        pe: 6.4,
        dividendYield: 8.2,
        price: 3.42,
        marketCap: '2.8B GHS',
      }),
    },
    {
      section: 'opportunity',
      title: 'Ghana 5-Year Treasury Bond: 24.5% Yield as Inflation Falls',
      subtitle: 'With inflation declining, Ghana\'s bonds offer a rare window for attractive returns.',
      bodyHtml: `<p>Ghana's 5-year treasury bond is yielding <strong>24.5% per annum</strong> as the Bank of Ghana's inflation-targeting regime shows results. With CPI declining from 35% to 19%, <strong>real yields remain deeply positive at approximately 5.5%</strong>.</p>

<p>Minimum investment: GHS 1,000 (~USD 65). The bond is denominated in GHS, so investors should factor in currency risk. However, the Cedi has been relatively stable in 2025, depreciating only 3.2% year-to-date.</p>`,
      readTime: 3,
      sortOrder: 4,
      meta: JSON.stringify({
        type: 'bond',
        yield: '24.5%',
        tenor: '5 years',
        minimum: 'GHS 1,000',
        risk: 'Moderate',
      }),
    },
    {
      section: 'diaspora_story',
      title: 'From Atlanta to Accra: How One Family\'s Remittances Became a Real Estate Empire',
      subtitle: 'The Mensah family turned 15 years of consistent remittances into a portfolio of 12 properties in Accra.',
      bodyHtml: `<p>When Kwame and Abena Mensah emigrated from Accra to Atlanta in 2008, they had $400 in their pockets and a single goal: build a better life for their children. Fifteen years later, they own <strong>12 rental properties in Accra's growing suburbs</strong>, all funded through disciplined remittance investing.</p>

<p>"We didn't do anything fancy," Abena explains from her home in Decatur, Georgia. "Every month, we sent $500 home. Not for spending — for building. We bought our first plot in Kasoa in 2011 for $3,000. Today, that land alone is worth $35,000."</p>

<blockquote>"The secret wasn't timing the market. It was consistency. We sent money home every single month for 15 years, rain or shine. Compound patience is the most powerful force in investing." — Kwame Mensah</blockquote>

<p>The Mensahs' story is increasingly common in the Ghanaian diaspora, where a growing community of investors is treating remittances not as charity, but as capital allocation.</p>`,
      readTime: 4,
      sortOrder: 5,
      meta: '{}',
    },
  ],
  sponsor: {
    sponsorName: 'GTBank',
    adHeadline: 'GTDiaspora — Banking Without Borders',
    adBody: 'Open a GTBank account from anywhere in the world. No need to visit a branch. Access Naira accounts, make transfers, pay bills, and invest in Nigerian securities — all from the GTWorld app.',
    adCtaText: 'Get Started',
    adCtaUrl: 'https://gtbank.com/diaspora',
  },
};

// ─── Issue #44 ─────────────────────────────────────────────────

const ISSUE_44: IssueData = {
  issueNumber: 44,
  slug: 'issue-44-afcfta-and-the-single-market-dream',
  subject: 'AfriSpine Digest #44 — AfCFTA and the Single Market Dream',
  coverHeadline: 'The AfCFTA Is Finally Working — And Investors Are Taking Notice',
  stories: [
    {
      section: 'cover_story',
      title: 'The AfCFTA Is Finally Working — And Investors Are Taking Notice',
      subtitle: 'Intra-African trade is surging as the Continental Free Trade Area removes barriers that have stifled commerce for decades.',
      bodyHtml: `<p>After years of slow implementation, the <strong>African Continental Free Trade Area (AfCFTA)</strong> is beginning to deliver on its promise. Intra-African trade rose 18% in 2024 to $92 billion, the fastest growth rate since the agreement was signed in 2018.</p>

<p>The removal of tariffs on 90% of goods traded between AfCFTA member states has created new investment opportunities in logistics, manufacturing, and agribusiness. <strong>Diaspora investors are uniquely positioned</strong> to capitalise on this trend, with their cross-border networks and cultural understanding serving as a natural bridge.</p>

<blockquote>"AfCFTA is creating the largest free trade area in the world by number of countries. For investors, this is what the EU single market looked like in the 1990s — enormous potential, still early." — Wamkele Mene, Secretary-General, AfCFTA Secretariat</blockquote>

<p>Key beneficiaries include East African logistics companies, Nigerian manufacturers expanding into Francophone West Africa, and Moroccan agribusiness firms accessing new markets across the Sahel.</p>`,
      readTime: 4,
      sortOrder: 1,
      meta: '{}',
    },
    {
      section: 'market_pulse',
      title: 'African Markets Pause After Strong Q1',
      subtitle: 'Markets consolidated this week as investors took profits following a strong first quarter.',
      bodyHtml: `<p>After a robust Q1 that saw the NGX gain 12% and the NSE rise 8%, African markets took a breather this week. <strong>NGX (-0.3%)</strong> posted a modest decline as profit-taking in the banking sector offset gains in consumer goods. <strong>NSE (+0.5%)</strong> was flat. <strong>JSE (+0.8%)</strong> edged higher on resource stocks. <strong>GSE (+1.2%)</strong> continued its upward momentum. <strong>BRVM (-0.2%)</strong> was slightly lower.</p>

<p>Analysts expect the consolidation to be temporary, with Q2 corporate earnings likely to provide fresh catalysts.</p>`,
      readTime: 3,
      sortOrder: 2,
      meta: JSON.stringify({
        exchanges: [
          { name: 'NGX', country: 'NG', change: -0.3 },
          { name: 'NSE', country: 'KE', change: 0.5 },
          { name: 'JSE', country: 'ZA', change: 0.8 },
          { name: 'GSE', country: 'GH', change: 1.2 },
          { name: 'BRVM', country: 'FR', change: -0.2 },
        ],
        topGainers: [{ ticker: 'NESTLE', name: 'Nestlé Nigeria', change: 3.8 }],
        topLosers: [{ ticker: 'BUACEMENT', name: 'BUA Cement', change: -2.9 }],
        fxRates: {
          'GBP/KES': '194.50',
          'USD/NGN': '1625.00',
          'USD/GHS': '15.65',
        },
      }),
    },
    {
      section: 'company_spotlight',
      title: 'Jumia: Africa\'s E-Commerce Giant Shows Path to Profitability',
      subtitle: 'After years of losses, Jumia\'s Q1 2025 results suggest a genuine turnaround is underway.',
      bodyHtml: `<p>Jumia (NYSE: JMIA) reported its <strong>first-ever quarterly adjusted EBITDA profit</strong> in Q1 2025, sending shares up 25% in a single session. The Pan-African e-commerce platform reduced operating losses by 67% year-over-year while growing revenue by 12%.</p>

<p>The company's focus on core markets — Nigeria, Egypt, Kenya, and Ghana — combined with aggressive cost-cutting and improved logistics efficiency, has finally delivered the profitability that investors have been waiting for since Jumia's 2019 IPO.</p>

<blockquote>"We stopped trying to be the Amazon of Africa. We started being the Jumia of Africa. And that made all the difference." — Jumia CEO Francis Dufay</blockquote>`,
      readTime: 3,
      sortOrder: 3,
      meta: JSON.stringify({
        ticker: 'JMIA',
        exchange: 'NYSE',
        pe: null,
        dividendYield: 0,
        price: 8.45,
        marketCap: '850M USD',
      }),
    },
    {
      section: 'opportunity',
      title: 'Ethiopia: Africa\'s Last Great Frontier Market Opens Up',
      subtitle: 'As Ethiopia liberalises its financial sector, early movers are capturing extraordinary returns.',
      bodyHtml: `<p>Ethiopia's decision to open its telecom and financial services sectors to foreign investors has created what many consider <strong>the last great frontier market opportunity in Africa</strong>. With a population of 120 million and GDP growth averaging 7.5% over the past decade, Ethiopia offers scale that no other African market can match.</p>

<p>The Ethiopian Investment Commission has established a <strong>one-stop shop for diaspora investors</strong>, offering expedited registration, tax incentives, and repatriation guarantees. Key sectors of opportunity include fintech, agriculture, renewable energy, and real estate.</p>`,
      readTime: 3,
      sortOrder: 4,
      meta: JSON.stringify({
        type: 'market',
        yield: 'N/A',
        tenor: 'N/A',
        minimum: 'Varies by sector',
        risk: 'High (frontier market)',
      }),
    },
    {
      section: 'diaspora_story',
      title: 'The Somali-British Entrepreneur Building East Africa\'s Largest Cold Chain',
      subtitle: 'How a former Amazon engineer in Slough is revolutionising food distribution across Kenya and Somalia.',
      bodyHtml: `<p><strong>Slough, UK</strong> — When <strong>Fardosa Hassan</strong> left her job as a supply chain engineer at Amazon's UK operations in 2022, her colleagues thought she was crazy. She was trading a six-figure salary for the uncertain world of African agribusiness. Two years later, her company — <strong>Barafu Logistics</strong> — operates the largest cold chain network in East Africa, with 45 refrigeration units spanning Nairobi, Mombasa, Garissa, and Mogadishu.</p>

<p>"I grew up watching my aunt in Garissa lose 40% of her mango harvest to rot because there was no cold storage," Fardosa explains. "Amazon was building the world's most sophisticated supply chain while my family's produce was literally dying on the side of the road. I had to fix that."</p>

<blockquote>"I didn't start a business. I solved a problem. The business was just the vehicle." — Fardosa Hassan, Founder, Barafu Logistics</blockquote>

<p>Barafu Logistics has raised $4.2 million from a consortium of diaspora angel investors and is now profitable, serving over 3,000 smallholder farmers. Fardosa's story exemplifies a growing trend: <strong>highly skilled African diaspora professionals returning not to their countries, but to their continent's opportunities.</strong></p>`,
      readTime: 4,
      sortOrder: 5,
      meta: '{}',
    },
  ],
  sponsor: {
    sponsorName: 'Jumia',
    adHeadline: 'Shop Africa\'s Largest Marketplace',
    adBody: 'Jumia — millions of products, fast delivery, secure payments. Shop from over 100,000 sellers across Nigeria, Kenya, Egypt, and Ghana. Download the Jumia app and get 15% off your first order with code AFRISPINE15.',
    adCtaText: 'Shop Now',
    adCtaUrl: 'https://jumia.com.ng',
  },
};

// ─── Subscription data ─────────────────────────────────────────

const SUBSCRIPTIONS = [
  { email: 'grace.wambui@nhs.scot', firstName: 'Grace', country: 'GB', frequency: 'weekly', marketFocus: 'KE', source: 'platform', whatsappOptIn: true },
  { email: 'chidi.okafor@outlook.com', firstName: 'Chidi', country: 'GB', frequency: 'weekly', marketFocus: 'NG', source: 'platform', whatsappOptIn: false },
  { email: 'kwame.asante@gmail.com', firstName: 'Kwame', country: 'GB', frequency: 'weekly', marketFocus: 'all', source: 'digest_website', whatsappOptIn: false },
  { email: 'adaeze.obi@chevron.com', firstName: 'Adaeze', country: 'US', frequency: 'weekly', marketFocus: 'NG', source: 'platform', whatsappOptIn: true },
  { email: 'peter.mwangi@yahoo.com', firstName: 'Peter', country: 'US', frequency: 'weekly', marketFocus: 'KE', source: 'platform', whatsappOptIn: false },
  { email: 'funke.alade@gmail.com', firstName: 'Funke', country: 'US', frequency: 'weekly', marketFocus: 'NG', source: 'referral', whatsappOptIn: true },
  { email: 'fardosa.hassan@barafu.co.ke', firstName: 'Fardosa', country: 'GB', frequency: 'weekly', marketFocus: 'KE', source: 'platform', whatsappOptIn: false },
  { email: 'kwame.mensah@icloud.com', firstName: 'Kwame', country: 'US', frequency: 'weekly', marketFocus: 'GH', source: 'digest_website', whatsappOptIn: false },
  { email: 'abena.mensah@gmail.com', firstName: 'Abena', country: 'US', frequency: 'weekly', marketFocus: 'GH', source: 'referral', whatsappOptIn: true },
  { email: 'thabo.mokoena@standardbank.co.za', firstName: 'Thabo', country: 'GB', frequency: 'weekly', marketFocus: 'ZA', source: 'platform', whatsappOptIn: false },
  { email: 'amara.diallo@orange.sn', firstName: 'Amara', country: 'FR', frequency: 'weekly', marketFocus: 'all', source: 'digest_website', whatsappOptIn: false },
  { email: 'joseph.kariuki@gmail.com', firstName: 'Joseph', country: 'AE', frequency: 'weekly', marketFocus: 'KE', source: 'platform', whatsappOptIn: true },
  { email: 'nneka.eze@shell.com', firstName: 'Nneka', country: 'NL', frequency: 'weekly', marketFocus: 'NG', source: 'platform', whatsappOptIn: false },
  { email: 'david.odhiambo@kpmg.co.uk', firstName: 'David', country: 'GB', frequency: 'daily', marketFocus: 'KE', source: 'platform', whatsappOptIn: false, isPro: true },
  { email: 'aisha.mohammed@emirates.com', firstName: 'Aisha', country: 'AE', frequency: 'daily', marketFocus: 'all', source: 'referral', whatsappOptIn: true, isPro: true },
];

// ─── Advertiser data ───────────────────────────────────────────

const ADVERTISERS = [
  {
    companyName: 'KCB Bank',
    logoUrl: 'https://afri-spine.com/sponsors/kcb-logo.png',
    industry: 'Banking',
    contactEmail: 'partnerships@kcbgroup.com',
    contactName: 'Grace Wanjiku',
    payments: [
      { package: 'monthly', amountUsd: 2500, status: 'completed' },
      { package: 'monthly', amountUsd: 2500, status: 'completed' },
    ],
  },
  {
    companyName: 'Equity Bank',
    logoUrl: 'https://afri-spine.com/sponsors/equity-logo.png',
    industry: 'Banking',
    contactEmail: 'diaspora@equitybank.co.ke',
    contactName: 'John Mwangi',
    payments: [
      { package: 'single', amountUsd: 1200, status: 'completed' },
    ],
  },
];

// ─── Main seed function ────────────────────────────────────────

async function seedIssue(data: IssueData, weeksAgo: number) {
  const existing = await db.digestIssue.findUnique({ where: { slug: data.slug } });
  if (existing) {
    console.log(`  ⏭  Issue #${data.issueNumber} already exists, skipping.`);
    return existing;
  }

  const issueDate = getIssueDate(weeksAgo);
  const publishedAt = weeksAgo === 0 ? new Date() : issueDate;

  const issue = await db.digestIssue.create({
    data: {
      issueNumber: data.issueNumber,
      slug: data.slug,
      issueDate,
      status: 'published',
      subject: data.subject,
      coverHeadline: data.coverHeadline,
      sentCount: 847 + Math.floor(Math.random() * 300),
      openRate: 38 + Math.random() * 12,
      clickRate: 8 + Math.random() * 5,
      publishedAt,
      stories: {
        create: data.stories.map((s) => ({
          slug: slugify(s.title),
          section: s.section,
          title: s.title,
          subtitle: s.subtitle,
          bodyHtml: s.bodyHtml,
          bodyText: stripHtml(s.bodyHtml),
          author: 'AfriSpine Digest AI',
          readTime: s.readTime,
          sortOrder: s.sortOrder,
          seoTitle: s.title,
          seoDescription: s.subtitle,
          meta: s.meta,
        })),
      },
      sponsorSlots: {
        create: {
          sponsorName: data.sponsor.sponsorName,
          sponsorLogoUrl: '',
          adHeadline: data.sponsor.adHeadline,
          adBody: data.sponsor.adBody,
          adCtaText: data.sponsor.adCtaText,
          adCtaUrl: data.sponsor.adCtaUrl,
          impressions: 2400 + Math.floor(Math.random() * 800),
          clicks: 180 + Math.floor(Math.random() * 100),
          status: 'published',
          issueDate,
        },
      },
    },
    include: { stories: true, sponsorSlots: true },
  });

  console.log(`  ✅ Issue #${data.issueNumber} created with ${issue.stories.length} stories and ${issue.sponsorSlots.length} sponsor slot.`);
  return issue;
}

async function seedSubscriptions() {
  console.log('\n📚 Seeding subscriptions...');
  let created = 0;
  for (const sub of SUBSCRIPTIONS) {
    const existing = await db.digestSubscription.findFirst({ where: { email: sub.email } });
    if (!existing) {
      await db.digestSubscription.create({
        data: {
          email: sub.email,
          firstName: sub.firstName,
          country: sub.country,
          frequency: sub.frequency,
          marketFocus: sub.marketFocus,
          source: sub.source,
          whatsappOptIn: sub.whatsappOptIn,
          isPro: (sub as any).isPro || false,
          isActive: true,
        },
      });
      created++;
    }
  }
  console.log(`  ✅ Created ${created} subscriptions (${SUBSCRIPTIONS.length - created} already existed).`);
}

async function seedAdvertisers() {
  console.log('\n💰 Seeding advertisers and payments...');
  let advCreated = 0;
  let payCreated = 0;

  for (const adv of ADVERTISERS) {
    const existing = await db.digestAdvertiser.findFirst({ where: { companyName: adv.companyName } });
    let advertiserId: string;

    if (existing) {
      advertiserId = existing.id;
    } else {
      const created = await db.digestAdvertiser.create({
        data: {
          companyName: adv.companyName,
          logoUrl: adv.logoUrl,
          industry: adv.industry,
          contactEmail: adv.contactEmail,
          contactName: adv.contactName,
          totalSpendUsd: adv.payments.reduce((sum, p) => sum + p.amountUsd, 0),
        },
      });
      advertiserId = created.id;
      advCreated++;
    }

    // Find the latest sponsored slot for this advertiser to link payments
    const slot = await db.sponsoredDigestSlot.findFirst({
      where: { sponsorName: adv.companyName },
      orderBy: { createdAt: 'desc' },
    });

    for (const pay of adv.payments) {
      if (slot) {
        const existingPay = await db.digestAdPayment.findFirst({
          where: { advertiserId, adId: slot.id },
        });
        if (!existingPay) {
          await db.digestAdPayment.create({
            data: {
              advertiserId,
              adId: slot.id,
              package: pay.package,
              amountUsd: pay.amountUsd,
              status: pay.status,
            },
          });
          payCreated++;
        }
      }
    }
  }

  console.log(`  ✅ Created ${advCreated} advertisers and ${payCreated} ad payments.`);
}

async function main() {
  console.log('🌾 AfriSpine Digest — Seed Script');
  console.log('=================================\n');

  console.log('📰 Seeding issues...');
  await seedIssue(ISSUE_47, 0);
  await seedIssue(ISSUE_46, 1);
  await seedIssue(ISSUE_45, 2);
  await seedIssue(ISSUE_44, 3);

  await seedSubscriptions();
  await seedAdvertisers();

  console.log('\n✨ Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());