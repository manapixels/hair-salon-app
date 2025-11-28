import React from 'react';
import { Heading, Text, Container, Grid } from '@radix-ui/themes';
import { CheckCircle, Plus } from '@/lib/icons';
import { notFound } from 'next/navigation';
import {
  ServiceHero,
  ServiceStats,
  ProcessStep,
  MaintenanceTip,
  ServiceFAQ,
  ServiceCTA,
} from '@/components/services';
import { BeforeAfterSlider } from '@/components/ui/BeforeAfterSlider';
import { getServiceContent } from '@/data/serviceContent';

// Bilingual Content - Inline
const CONTENT = {
  en: {
    hero: {
      badge: 'Keratin Smoothing',
      headline: 'Frizz-Free.\nEffortlessly Smooth.',
      subheading:
        'Transform unmanageable hair into silky perfection. Our premium keratin treatments reduce styling time and boost shine.',
    },
    stats: {
      maintenance: { label: 'Lasts For', value: '3 - 5 Months' },
      duration: { label: 'Duration', value: '2 - 3 Hours' },
    },
    why: {
      title: 'Why Keratin Treatment?',
      subtitle:
        'Frizz, unruliness, and lack of shine often result from damaged cuticles and humidity. Our keratin treatments smooth the hair shaft and lock in moisture.',
      items: [
        {
          title: 'Frizzy & Unmanageable',
          solution: 'Smooths the hair cuticle to eliminate frizz and reduce volume.',
        },
        {
          title: 'Styling Difficulty',
          solution: 'Reduces blow-dry time by up to 50% and makes styling effortless.',
        },
        {
          title: 'Damaged/Porous Hair',
          solution: 'Fills in gaps in the hair cuticle with protein for strength and shine.',
        },
        {
          title: 'Humidity Sensitivity',
          solution: 'Creates a protective barrier that blocks out humidity and prevents puffiness.',
        },
      ],
    },
    treatmentsTitle: 'Our Keratin Treatments',
    treatments: [
      {
        title: 'Hair Treatment (Normal)',
        description:
          'Professional surface conditioning treatment using cream-based conditioners. Provides immediate moisture boost through heat-activated penetration, ideal for weekly maintenance and quick hydration without long-term commitment.',
        benefits: ['Instant softness', 'Quick moisture boost', 'Lasts 3-7 days'],
      },
      {
        title: 'Shiseido Treatment (Japan)',
        description:
          "Premium Japanese reconstruction therapy using Shiseido's Double Repair System and Hair Reform Technology. Targets the inner hair cortex to restore the cross-sectional shape of damaged strands, mimicking the hair's natural moisture barrier.",
        benefits: [
          'Corrects strand shape distortion',
          'Restores inner strength',
          'Lasts 3-4 weeks',
        ],
      },
      {
        title: 'Mucota Treatment (Japan)',
        description:
          'Advanced Japanese treatment designed specifically for Asian hair types, featuring rich Argan oil and Cell Membrane Complex (CMC). Uses molecular layering technique to penetrate different hair depths, creating a protective veil that locks moisture inside.',
        benefits: ['Multi-layer penetration', 'Extreme softness', 'Lasts 4-6 weeks'],
      },
      {
        title: 'K-Gloss Keratin (USA)',
        description:
          'Water-based hybrid formula combining keratin and collagen, that fills hair porosity to eliminate frizz while maintaining natural volume. Delivers instant gloss without forcing hair flat.',
        benefits: ['Frizz elimination', 'No harsh chemicals', 'Lasts 3-4 months'],
      },
      {
        title: 'Tiboli Keratin (USA)',
        description:
          'Elite smoothing system using patented Trioxxy® protein blend for intense straightening and frizz control. Forms a protective protein shield over each strand that physically holds hair in a smoother, straighter position.',
        benefits: ['Maximum smoothing power', 'Humidity protection', 'Lasts 3-5 months'],
      },
    ],
    keratin: {
      title: 'Experience the Transformation',
      description:
        'Our keratin treatment is a long-lasting solution that improves hair structure for easier styling. It fills in porous gaps in the hair cuticle with protein, strengthening and repairing damaged strands while locking out humidity.',
      benefits: [
        'Frizz control for up to 3-5 months',
        'Reduces styling time by 50%',
        'Adds brilliant shine',
        'Safe & Non-damaging',
        'No harsh regrowth line',
        'Repairs damaged cuticles',
      ],
    },
    faq: {
      title: 'Keratin Treatment FAQs',
      description: 'Common questions about our keratin smoothing services.',
      questions: [
        {
          question: 'How long does keratin treatment last?',
          answer:
            "Keratin treatments typically last 3-5 months, gradually fading over time as you wash your hair. Unlike rebonding, keratin doesn't create a harsh regrowth line—it simply reverts to your natural texture. Results last longer with sulfate-free products and less frequent washing.",
        },
        {
          question: "What's the difference between keratin treatment and rebonding?",
          answer:
            'Keratin is a temporary smoothing treatment (3-5 months) that reduces frizz and adds shine while maintaining some natural movement. Rebonding is a permanent chemical straightening process that creates pin-straight hair lasting 6-8 months with only root regrowth. Keratin is gentler and more reversible, while rebonding is more dramatic and permanent.',
        },
        {
          question: 'Can I get keratin treatment on colored or bleached hair?',
          answer:
            'Yes! Keratin treatment is actually beneficial for colored or bleached hair, as it helps seal the cuticle and restore smoothness. We recommend waiting 1-2 weeks after coloring for best results. The treatment can help extend color vibrancy by reducing porosity.',
        },
        {
          question: 'Will keratin treatment make my hair completely straight?',
          answer:
            "No—keratin reduces frizz and smooths hair but doesn't eliminate curls or waves entirely. You'll retain natural movement and body, just in a more controlled, polished form. If you want completely straight hair, rebonding would be more appropriate.",
        },
        {
          question: 'What should I avoid after keratin treatment?',
          answer:
            'For the first 3 days, avoid washing hair, tying it up, or using clips/headbands. After that, use sulfate-free shampoo and conditioner, minimize heat styling, and avoid chlorinated water. These precautions help extend the life of your treatment.',
        },
        {
          question: 'How is your keratin treatment different from at-home products?',
          answer:
            'Professional keratin uses higher-quality formulas with controlled application and heat-sealing techniques that ensure even distribution and longer-lasting results. At-home treatments lack the professional heat-sealing step and often provide more temporary results (4-6 weeks vs. 3-5 months).',
        },
      ],
    },
    cta: {
      title: 'Ready for Silky Smooth Hair?',
      description: 'Book your keratin treatment today and say goodbye to frizz.',
      button: 'Book Keratin Treatment',
    },
    process: {
      title: 'The Treatment Journey',
      steps: [
        {
          number: '1',
          title: 'Consultation',
          description:
            'We assess your hair texture, porosity, and damage level to determine the ideal keratin formula for your needs.',
        },
        {
          number: '2',
          title: 'Clarifying Wash',
          description:
            'A specialized deep-cleansing shampoo removes all residue and opens the hair cuticle for maximum absorption.',
        },
        {
          number: '3',
          title: 'Application',
          description:
            'The keratin treatment is applied section by section, ensuring every strand is completely saturated.',
        },
        {
          number: '4',
          title: 'Processing & Drying',
          description:
            'After the formula sets, we blow-dry the hair to lock in the treatment and prepare it for sealing.',
        },
        {
          number: '5',
          title: 'Heat Sealing',
          description:
            'We use a flat iron at a precise temperature to seal the keratin into the cuticle, creating a smooth, glossy finish.',
        },
      ],
    },
    aftercare: {
      title: 'Aftercare Tips',
      tips: [
        {
          title: 'Wait 72 Hours',
          text: 'Do not wash, tie, or pin your hair for 3 days. This allows the keratin to fully set and bond with your hair.',
        },
        {
          title: 'Sulfate-Free Only',
          text: "Always use sulfate-free shampoo and conditioner. Sulfates strip the keratin coating and shorten the treatment's lifespan.",
        },
        {
          title: 'Avoid Salt Water',
          text: 'Salt water and chlorine can erode the treatment. Rinse hair with fresh water before swimming and apply a leave-in conditioner.',
        },
        {
          title: 'Silk Pillowcase',
          text: 'Sleeping on a silk or satin pillowcase reduces friction, helping to maintain smoothness and prevent frizz while you sleep.',
        },
      ],
    },
  },
  zh: {
    hero: {
      badge: '角蛋白顺滑',
      headline: '告别毛躁。\n轻松顺滑。',
      subheading: '将难以打理的头发转变为丝般完美。我们的高级角蛋白护理减少造型时间并提升光泽。',
    },
    stats: {
      maintenance: { label: '维持时间', value: '3 - 5 个月' },
      duration: { label: '时长', value: '2 - 3 小时' },
    },
    why: {
      title: '为何选择角蛋白护理？',
      subtitle:
        '毛躁、难以打理和缺乏光泽通常源于受损的毛鳞片和湿气。我们的角蛋白护理抚平发丝并锁住水分。',
      items: [
        {
          title: '毛躁和难以打理',
          solution: '抚平头发毛鳞片，消除毛躁并减少蓬松度。',
        },
        {
          title: '造型困难',
          solution: '减少高达50%的吹干时间，让造型变得轻松省力。',
        },
        {
          title: '受损/多孔发质',
          solution: '用蛋白质填充毛鳞片的空隙，增加强度和光泽。',
        },
        {
          title: '对湿气敏感',
          solution: '建立保护屏障，阻隔湿气，防止头发蓬乱。',
        },
      ],
    },
    treatmentsTitle: '我们的角蛋白护理',
    treatments: [
      {
        title: '头发护理（常规）',
        description:
          '使用乳霜基护发素的专业表面调理护理。通过热激活渗透提供即时水分补充，适合每周保养和快速补水，无需长期承诺。',
        benefits: ['即时柔软', '快速补水', '维持3-7天'],
      },
      {
        title: '资生堂护理（日本）',
        description:
          '高级日本重建疗法，使用资生堂双重修复系统和头发改造技术。针对内部发芯以恢复受损发丝的横截面形状，模仿头发的天然水分屏障。',
        benefits: ['纠正发丝形状扭曲', '恢复内部强度', '维持3-4周'],
      },
      {
        title: '慕歌塔护理（日本）',
        description:
          '专为亚洲发质设计的先进日本护理，富含摩洛哥坚果油和细胞膜复合物(CMC)。使用分子分层技术渗透不同发质深度，形成锁住水分的保护层。',
        benefits: ['多层渗透', '极致柔软', '维持4-6周'],
      },
      {
        title: 'K-Gloss角蛋白（美国）',
        description:
          '水基混合配方，结合角蛋白和胶原蛋白，填充发质孔隙以消除毛躁，同时保持自然蓬松度。提供即时光泽，不会使头发扁平。',
        benefits: ['消除毛躁', '无刺激化学物质', '维持3-4个月'],
      },
      {
        title: 'Tiboli角蛋白（美国）',
        description:
          '精英顺滑系统，使用专利Trioxxy®蛋白混合物进行强效拉直和毛躁控制。在每根发丝上形成保护性蛋白层，物理性地保持头发更顺滑、更笔直的状态。',
        benefits: ['最大顺滑力', '防潮保护', '维持3-5个月'],
      },
    ],
    keratin: {
      title: '体验蜕变',
      description:
        '我们的角蛋白护理是改善发质结构以便更易造型的持久解决方案。它用蛋白质填充发丝毛鳞片的空隙，强化并修复受损发丝，同时阻隔湿气。',
      benefits: [
        '控制毛躁可维持3-5个月',
        '减少50%造型时间',
        '增添亮丽光泽',
        '安全无损伤',
        '无明显长发线',
        '修复受损毛鳞片',
      ],
    },
    faq: {
      title: '角蛋白护理常见问题',
      description: '关于我们角蛋白顺滑服务的常见问题。',
      questions: [
        {
          question: '角蛋白护理能维持多久？',
          answer:
            '角蛋白护理通常可维持3-5个月，随着洗头逐渐褪色。与拉直不同，角蛋白不会产生明显的长发线——它只是恢复到您的自然质地。使用无硫酸盐产品和减少洗头次数可以延长效果。',
        },
        {
          question: '角蛋白护理和拉直有何区别？',
          answer:
            '角蛋白是暂时性顺滑护理（3-5个月），可减少毛躁并增加光泽，同时保持一些自然动感。拉直是永久性化学拉直过程，打造笔直头发，可维持6-8个月，只有发根会长出。角蛋白更温和且更可逆，而拉直更具戏剧性且永久。',
        },
        {
          question: '染色或漂过的头发能做角蛋白护理吗？',
          answer:
            '可以！角蛋白护理实际上对染色或漂过的头发有益，因为它有助于密封毛鳞片并恢复顺滑。我们建议染色后等待1-2周以获得最佳效果。该护理可以通过减少多孔性来帮助延长发色鲜艳度。',
        },
        {
          question: '角蛋白护理会让头发完全笔直吗？',
          answer:
            '不会——角蛋白减少毛躁并使头发顺滑，但不会完全消除卷曲或波浪。您将保留自然的动感和蓬松感，只是以更受控、更精致的形式呈现。如果您想要完全笔直的头发，拉直会更合适。',
        },
        {
          question: '角蛋白护理后应避免什么？',
          answer:
            '前3天，避免洗头、扎头发或使用发夹/发带。之后，使用无硫酸盐洗发水和护发素，减少热造型，避免含氯水。这些预防措施有助于延长护理效果。',
        },
        {
          question: '您的角蛋白护理与家用产品有何不同？',
          answer:
            '专业角蛋白使用更高质量的配方，通过控制涂抹和热密封技术确保均匀分布和更持久的效果。家用护理缺少专业的热密封步骤，通常提供更短暂的效果（4-6周 vs. 3-5个月）。',
        },
      ],
    },
    cta: {
      title: '准备好拥有丝般顺滑的头发了吗？',
      description: '立即预约角蛋白护理，告别毛躁。',
      button: '预约角蛋白护理',
    },
    process: {
      title: '护理流程',
      steps: [
        {
          number: '1',
          title: '咨询',
          description: '我们评估您的发质、孔隙率和受损程度，以确定最适合您需求的角蛋白配方。',
        },
        {
          number: '2',
          title: '深层清洁',
          description: '使用专门的深层清洁洗发水去除所有残留物并打开毛鳞片，以实现最大吸收。',
        },
        {
          number: '3',
          title: '涂抹',
          description: '逐层涂抹角蛋白护理，确保每一根发丝都完全浸透。',
        },
        {
          number: '4',
          title: '处理与吹干',
          description: '配方定型后，我们吹干头发以锁住护理成分并为密封做准备。',
        },
        {
          number: '5',
          title: '热密封',
          description: '我们使用精确温度的直发夹将角蛋白密封入毛鳞片，打造顺滑光泽的表面。',
        },
      ],
    },
    aftercare: {
      title: '护理后提示',
      tips: [
        {
          title: '等待72小时',
          text: '3天内不要洗头、扎头发或别发夹。这让角蛋白能完全定型并与头发结合。',
        },
        {
          title: '仅限无硫酸盐',
          text: '务必使用无硫酸盐洗发水和护发素。硫酸盐会剥离角蛋白涂层并缩短护理寿命。',
        },
        {
          title: '避免盐水',
          text: '盐水和氯气会侵蚀护理层。游泳前用淡水冲洗头发并涂抹免洗护发素。',
        },
        {
          title: '真丝枕套',
          text: '睡在真丝或缎面枕套上可减少摩擦，有助于在睡眠时保持顺滑并防止毛躁。',
        },
      ],
    },
  },
};

// TODO: Implement i18n context for language switching
// For now, using English content
const content = CONTENT.en;

// --- Local Components ---

const TreatmentCard = ({
  title,
  description,
  benefits,
}: {
  title: string;
  description: string;
  benefits: string[];
}) => (
  <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-all h-full flex flex-col">
    <div className="flex justify-between items-start mb-4">
      <Heading size="4" className="font-serif text-stone-900">
        {title}
      </Heading>
    </div>
    <Text className="text-stone-600 text-sm mb-6 flex-grow">{description}</Text>
    <div className="pt-4 border-t border-stone-50">
      <Text className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3 block">
        Benefits
      </Text>
      <ul className="space-y-2">
        {benefits.map((b, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-stone-500">
            <CheckCircle className="w-4 h-4 text-teal-500 shrink-0" />
            {b}
          </li>
        ))}
      </ul>
    </div>
  </div>
);

const ProblemSolution = ({ problem, solution }: { problem: string; solution: string }) => (
  <div className="flex gap-4 items-start">
    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-1">
      <Plus className="w-5 h-5 rotate-45" />
    </div>
    <div>
      <Text className="block font-bold text-stone-900 mb-1">{problem}</Text>
      <Text className="text-stone-600 text-sm">{solution}</Text>
    </div>
  </div>
);

// --- Main Page ---

export default function KeratinTreatmentPage() {
  // Get static content for keratin treatment service
  const serviceContent = getServiceContent('keratin-treatment');

  // if (!serviceContent) notFound();
  const servicePrice = 'From $35';

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <ServiceHero
        backgroundImage="/background-images/keratin-treatment.png"
        badge={{ text: content.hero.badge, color: 'rose' }}
        headline={content.hero.headline}
        subheading={content.hero.subheading}
      />

      {/* Stats */}
      <ServiceStats
        stats={[
          { label: content.stats.maintenance.label, value: content.stats.maintenance.value },
          { label: content.stats.duration.label, value: content.stats.duration.value },
          { label: 'Price', value: servicePrice },
        ]}
      />

      {/* About Keratin Section */}
      <Container size="4" className="px-6 md:px-12 py-16 bg-stone-50">
        <Container size="4" className="px-6 md:px-12 py-16 bg-white md:rounded-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
            {/* Why Keratin Treatment? */}
            <div>
              <Heading size="7" className="font-serif text-stone-900 mb-6">
                {content.why.title}
              </Heading>
              <Text className="text-stone-600 mb-8 block">{content.why.subtitle}</Text>
              <div className="space-y-6">
                {content.why.items.map((why, index) => (
                  <ProblemSolution key={index} problem={why.title} solution={why.solution} />
                ))}
              </div>
            </div>
            {/* Right: Image  */}
            <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-lg">
              <BeforeAfterSlider
                beforeImage="/images/before-after/keratin-before.png"
                afterImage="/images/before-after/keratin-after.png"
                beforeLabel="Frizzy & Damaged"
                afterLabel="Smooth & Silky"
              />
            </div>
          </div>
        </Container>
      </Container>

      {/* Available Treatments */}
      <Container size="4" className="px-6 md:px-12 py-16 bg-white">
        <Heading size="6" className="font-serif text-center text-stone-900 mb-10">
          {content.treatmentsTitle}
        </Heading>
        <Grid columns={{ initial: '1', md: '3' }} gap="6">
          {content.treatments.map((treatment, index) => (
            <TreatmentCard
              key={index}
              title={treatment.title}
              description={treatment.description}
              benefits={treatment.benefits}
            />
          ))}
        </Grid>
      </Container>

      {/* Process & Aftercare */}
      <Container size="4" className="px-6 md:px-12 py-16 bg-white">
        <Grid columns={{ initial: '1', md: '2' }} gap="16">
          {/* Left: Process */}
          <div className="p-8 md:p-12">
            <Heading size="7" className="font-serif text-stone-900 mb-8">
              {content.process.title}
            </Heading>
            <div className="space-y-8">
              {content.process.steps.map((step, index) => (
                <ProcessStep
                  key={index}
                  number={step.number}
                  title={step.title}
                  description={step.description}
                  colorScheme="rose"
                />
              ))}
            </div>
          </div>

          {/* Right: Aftercare */}
          <div className="bg-stone-50 rounded-3xl p-8 md:p-12">
            <Heading size="7" className="font-serif text-stone-900 mb-8">
              {content.aftercare.title}
            </Heading>
            <div className="space-y-4">
              {content.aftercare.tips.map((tip, index) => (
                <MaintenanceTip key={index} title={tip.title} text={tip.text} />
              ))}
            </div>
          </div>
        </Grid>
      </Container>

      {/* FAQ Section */}
      <ServiceFAQ
        title={content.faq.title}
        description={content.faq.description}
        questions={content.faq.questions}
      />

      {/* CTA Section */}
      <ServiceCTA
        title={content.cta.title}
        description={content.cta.description}
        serviceName="Keratin Treatment"
      />
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: 'Keratin Hair Treatments | Signature Trims',
    description:
      'Achieve silky, frizz-free hair with our professional keratin smoothing treatments. Long-lasting shine and manageability.',
  };
}
