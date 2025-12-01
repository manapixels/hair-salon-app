import React from 'react';
import { Heading, Text, Container, Grid } from '@radix-ui/themes';
import { Info } from '@/lib/icons';
import { notFound } from 'next/navigation';
import {
  ServiceHero,
  ServiceStats,
  ProcessStep,
  MaintenanceTip,
  ServiceTypeCard,
  ServiceFAQ,
  ServiceCTA,
} from '@/components/services';
import { getServiceContent } from '@/data/serviceContent';
import { getServiceCategories } from '@/lib/database';

// Bilingual Content - Inline
const CONTENT = {
  en: {
    hero: {
      badge: 'Hair Rebonding',
      headline: 'Silky Smooth Sleekness',
      subheading:
        'Achieve permanently straight, glossy hair that lasts for months. Say goodbye to daily styling and hello to sleek perfection.',
    },
    stats: {
      maintenance: { label: 'Maintenance', value: '6 to 12 Months' },
      duration: { label: 'Duration', value: '1 to 4 Hours' },
    },
    overview: {
      title: 'Choose Your Finish',
      subtitle:
        'Not all straight hair is the same. Customize your look with our specialized techniques.',
    },
    types: [
      {
        title: 'Hair Rebonding',
        description: 'Ultra-straight finish with smoothness for a sleek, polished look.',
        image: '/rebond-types/hair-rebonding.png',
      },
      {
        title: 'Roots Rebonding',
        description:
          'Targeted straightening for newly grown, wavy roots without over-processing the rest of your hair.',
        image: '/rebond-types/roots-rebonding.png',
      },
      {
        title: 'Fringe Rebonding',
        description:
          'Specialized straightening for your bangs. Achieve face-framing fringe while maintaining natural texture in the rest of your hair for a stylish look with minimal commitment.',
        image: '/rebond-types/fringe-rebonding.png',
      },
    ],
    process: {
      title: 'The Process',
      steps: [
        {
          number: '1',
          title: 'Hair Analysis & Consultation',
          description:
            "We assess your hair's texture, previous treatments, and overall condition to determine the best rebonding formula and technique.",
        },
        {
          number: '2',
          title: 'Relaxer Application',
          description:
            'A carefully selected straightening cream is applied section by section to break down natural bonds. Formula strength is customized to your hair type.',
        },
        {
          number: '3',
          title: 'Processing & Monitoring',
          description:
            'The relaxer processes while we closely monitor straightening progress. This critical step requires expert timing to achieve smooth results.',
        },
        {
          number: '4',
          title: 'Blow-Dry & Flat-Iron',
          description:
            'After thorough rinsing, your hair is precision blow-dried to 100% straight. Each section is carefully flat-ironed at controlled temperature.',
        },
        {
          number: '5',
          title: 'Neutralizer Application',
          description:
            'A neutralizing solution is applied to rebuild and lock hair bonds in their new straight formation for long-lasting results.',
        },
        {
          number: '6',
          title: 'Final Styling & Treatment',
          description:
            'After a final rinse, we apply a nourishing treatment to restore moisture. Your hair is styled to showcase the sleek finish.',
        },
      ],
    },
    aftercare: {
      title: 'Aftercare Tips',
      tips: [
        {
          title: 'The 72-Hour Rule',
          text: 'Do not wash, wet, or tie your hair for 3 full days after rebonding to allow the bonds to fully set.',
        },
        {
          title: 'Sleep Smart',
          text: 'Sleep on a silk or satin pillowcase and keep hair completely straight while sleeping.',
        },
        {
          title: 'Avoid Creases',
          text: 'Avoid tucking hair behind ears or using hair clips in the first 72 hours—any bends will set permanently.',
        },
        {
          title: 'Use Right Products',
          text: 'Use only sulfate-free shampoo and conditioner formulated for chemically treated hair.',
        },
        {
          title: 'Deep Condition Weekly',
          text: 'Apply a deep conditioning mask weekly to maintain moisture and prevent dryness.',
        },
        {
          title: 'Minimize Heat',
          text: 'Minimize heat styling; when necessary, use low heat settings with heat protectant.',
        },
      ],
    },
    faq: {
      title: 'Frequently Asked Questions',
      description: 'Common questions about our rebonding services.',
      questions: [
        {
          question: 'How long does rebonding last?',
          answer:
            "Rebonding results are permanent on the treated hair. As your hair grows, you'll see natural texture at the roots, typically requiring a root touch-up every 6-8 months. The straightened portions will remain straight until you cut them off or grow them out.",
        },
        {
          question: 'Can I color my hair after rebonding?',
          answer:
            'We recommend waiting at least 2-3 weeks after rebonding before coloring your hair, as both are chemical processes that can stress hair. Ideally, color your hair 1-2 weeks before your rebonding appointment. Consult with us to create the safest sequence for your hair goals.',
        },
        {
          question: 'Is rebonding damaging to hair?',
          answer:
            "Rebonding is a chemical process that does alter hair structure, so some stress to the hair is inevitable. However, using premium formulas like Shiseido or Mucota, proper technique, and post-treatment care significantly minimizes damage. We don't recommend rebonding on very damaged, over-processed, or extremely fragile hair.",
        },
        {
          question: "What's the difference between rebonding and keratin treatment?",
          answer:
            'Rebonding chemically alters hair structure for permanently straight results, while keratin treatments are temporary (3-5 months) and reduce frizz without making hair pin-straight. Rebonding creates straighter results but is more of a commitment, while keratin is gentler and more reversible.',
        },
        {
          question: 'What should I avoid after rebonding?',
          answer:
            'For the first 3 days: no washing, no tying hair up, no clips/headbands, no tucking behind ears, and sleep on a silk pillowcase. After 3 days, avoid high heat styling, chlorinated water, and tight hairstyles. Always use sulfate-free products formulated for chemically treated hair.',
        },
      ],
    },
    cta: {
      title: 'Experience Sleek Perfection',
      description:
        'Ready for permanently straight hair? Book a rebonding consultation to discuss your straightening goals and hair condition.',
      button: 'Book Your Rebonding Consultation',
    },
  },
  zh: {
    hero: {
      badge: '质感控制',
      headline: '丝滑顺直。完美笔直。\n轻松美丽。',
      subheading: '打造持续数月的永久直发和光泽发质。告别每日造型，拥抱顺滑完美。',
    },
    stats: {
      maintenance: { label: '维护周期', value: '6-8个月补做发根' },
      duration: { label: '时长', value: '3.5-4.5小时' },
    },
    overview: {
      title: '选择您的效果',
      subtitle: '并非所有直发都相同。用我们的专业技术定制您的造型。',
    },
    types: [
      {
        title: '头发拉直',
        description: '超级笔直、针状笔直效果，带高光泽度。最大化顺滑，打造光滑精致造型。',
        image: '/rebond-types/hair-rebonding.png',
      },
      {
        title: '发根拉直',
        description: '针对新长的波浪发根进行定向拉直，不会过度处理头发其余部分。',
        image: '/rebond-types/roots-rebonding.png',
      },
      {
        title: '刘海拉直',
        description:
          '专门为刘海拉直。打造衬托脸型的刘海，同时保持头发其余部分的自然质感，呈现时尚造型，承诺最小。',
        image: '/rebond-types/fringe-rebonding.png',
      },
    ],
    process: {
      title: '服务流程',
      steps: [
        {
          number: '1',
          title: '发质分析与咨询',
          description: '我们评估您的发质、以往护理和整体状况，以确定最佳的拉直配方和技术。',
        },
        {
          number: '2',
          title: '拉直剂涂抹',
          description: '精心挑选的拉直霜逐部分涂抹，分解天然键合。配方强度根据您的发质定制。',
        },
        {
          number: '3',
          title: '处理与监测',
          description:
            '拉直剂作用期间，我们密切监测拉直进展。这一关键步骤需要专业的时间把握以获得顺滑效果。',
        },
        {
          number: '4',
          title: '吹干与直板夹',
          description:
            '彻底冲洗后，您的头发被精准吹干至100%笔直。每个部分都在控制温度下小心使用直板夹。',
        },
        {
          number: '5',
          title: '中和剂涂抹',
          description: '涂抹中和液以重建并锁定头发键合的新笔直形态，确保持久效果。',
        },
        {
          number: '6',
          title: '最终造型与护理',
          description: '最后冲洗后，我们涂抹滋养护理以恢复水分。为您的头发造型，展现顺滑效果。',
        },
      ],
    },
    aftercare: {
      title: '护理建议',
      tips: [
        {
          title: '72小时规则',
          text: '拉直后整整3天不要洗头、弄湿或扎头发，让键合充分定型。',
        },
        {
          title: '智能睡眠',
          text: '使用真丝或缎面枕套睡觉，睡觉时保持头发完全笔直。',
        },
        {
          title: '避免折痕',
          text: '前72小时避免将头发别在耳后或使用发夹——任何弯曲都会永久定型。',
        },
        {
          title: '使用正确产品',
          text: '只使用化学处理头发专用的无硫酸盐洗护产品。',
        },
        {
          title: '每周深层护理',
          text: '每周使用深层护发膜，保持水分并防止干燥。',
        },
        {
          title: '减少热量',
          text: '减少热造型；必要时使用低热设置并涂抹隔热产品。',
        },
      ],
    },
    faq: {
      title: '常见问题',
      description: '关于我们拉直服务的常见问题。',
      questions: [
        {
          question: '拉直能维持多久？',
          answer:
            '拉直效果在处理过的头发上是永久的。随着头发生长，您会看到发根的自然质地，通常需要每6-8个月补做发根。拉直的部分会一直保持笔直，直到您剪掉或长出。',
        },
        {
          question: '拉直后能染发吗？',
          answer:
            '我们建议拉直后至少等待2-3周再染发，因为两者都是会给头发带来压力的化学过程。理想情况下，在拉直预约前1-2周染发。咨询我们以制定最安全的顺序来实现您的发型目标。',
        },
        {
          question: '拉直会损伤头发吗？',
          answer:
            '拉直是改变头发结构的化学过程，因此对头发的一些压力不可避免。但是，使用资生堂或慕歌塔等高级配方、正确的技术和护理后护理可显著减少损伤。我们不建议为损伤严重、过度处理或极度脆弱的头发做拉直。',
        },
        {
          question: '拉直和角蛋白护理有何区别？',
          answer:
            '拉直化学改变头发结构以获得永久笔直效果，而角蛋白护理是暂时的（3-5个月），减少毛躁但不会使头发笔直。拉直打造更笔直的效果但更具承诺性，而角蛋白更温和且更可逆。',
        },
        {
          question: '拉直后应避免什么？',
          answer:
            '前3天：不洗头、不扎头发、不用发夹/发带、不别在耳后，使用真丝枕套睡觉。3天后，避免高热造型、含氯水和紧绷发型。始终使用化学处理头发专用的无硫酸盐产品。',
        },
      ],
    },
    cta: {
      title: '体验顺滑完美',
      description: '准备好拥有永久直发了吗？预约拉直咨询，讨论您的拉直目标和发质状况。',
      button: '立即预约拉直咨询',
    },
  },
};

// TODO: Implement i18n context for language switching
// For now, using English content
const content = CONTENT.en;

// --- Main Page ---

export default async function HairRebondingPage() {
  // Get static content for hair rebonding service
  const serviceContent = getServiceContent('hair-rebonding');

  if (!serviceContent) notFound();
  const servicePrice = 'From $70';

  // Fetch service ID from database
  const categories = await getServiceCategories();
  const hairRebondingService = categories
    .flatMap(cat => cat.items)
    .find(service => service.name.toLowerCase().includes('rebonding'));
  const serviceId = hairRebondingService?.id;

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <ServiceHero
        backgroundImage="/background-images/hair-rebonding.jpg"
        badge={{ text: content.hero.badge, color: 'teal' }}
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

      {/* Introduction */}
      <Container size="3" className="px-6 md:px-12 text-center">
        <p className="text-lg md:text-xl text-stone-600 leading-relaxed max-w-2xl mx-auto">
          Transform unruly, wavy, or frizzy hair into silky-smooth perfection with our professional
          hair rebonding services. Whether you desire pin-straight strands or simply want
          easier-to-manage hair, we use advanced techniques to deliver lasting results.
        </p>
      </Container>

      {/* Rebonding Types */}
      <Container size="4" className="px-6 md:px-12 py-16 bg-white">
        <div className="text-center mb-16">
          <Heading size="8" className="font-serif text-stone-900 mb-4">
            {content.overview.title}
          </Heading>
          <Text className="text-stone-500 text-lg max-w-2xl mx-auto">
            {content.overview.subtitle}
          </Text>
        </div>

        <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="8">
          {content.types.map((type, index) => (
            <ServiceTypeCard
              key={index}
              title={type.title}
              description={type.description}
              image={type.image}
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
                  colorScheme="teal"
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

            <div className="mt-8 p-4 bg-stone-200 rounded-xl flex gap-4 items-start">
              <Info className="w-5 h-5 text-stone-600 shrink-0 mt-1" />
              <Text className="text-sm text-stone-800">
                <strong>Note:</strong> Rebonding is permanent on the treated hair. You will only
                need to touch up the roots as they grow out.
              </Text>
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
        serviceName="Hair Rebonding"
        serviceId={serviceId}
      />
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: 'Hair Rebonding | Signature Trims',
    description:
      'Achieve sleek, pin-straight hair or soft volume with our professional rebonding services. Long-lasting, frizz-free results.',
  };
}
