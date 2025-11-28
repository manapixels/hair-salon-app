import React from 'react';
import { Heading, Text, Container, Grid, Badge } from '@radix-ui/themes';
import Image from 'next/image';
import { CheckCircle, Plus } from '@/lib/icons';
import { notFound } from 'next/navigation';
import ServiceBookingWrapper from '@/components/services/ServiceBookingWrapper';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { BeforeAfterSlider } from '@/components/ui/BeforeAfterSlider';
import { getServiceContent } from '@/data/serviceContent';

// Bilingual Content - Inline
const CONTENT = {
  en: {
    hero: {
      badge: 'Scalp Therapy',
      headline: 'Comprehensive\nScalp Wellness',
      subheading:
        'Healthy hair starts with a healthy scalp. Address concerns at the source with our advanced therapeutic treatments.',
    },
    stats: {
      type: { label: 'Treatment Type', value: 'Scalp Therapy' },
      maintenance: { label: 'Maintenance', value: 'Monthly' },
      duration: { label: 'Duration', value: '60 - 90 mins' },
    },
    why: {
      title: 'Why Scalp Care Matters',
      subtitle:
        'Issues like oiliness, dandruff, and hair loss often stem from a clogged or unbalanced scalp. Our treatments deep cleanse and nourish the follicles.',
      items: [
        {
          title: 'Oily Scalp',
          solution: 'Regulates sebum production to prevent greasiness and clogged pores.',
        },
        {
          title: 'Hair Loss',
          solution: 'Stimulates blood circulation and strengthens roots to reduce shedding.',
        },
        {
          title: 'Sensitive/Itchy',
          solution: "Soothes inflammation and restores the scalp's natural protective barrier.",
        },
        {
          title: 'Dandruff & Flaking',
          solution: 'Targeted formulas effectively address flaking at the source.',
        },
      ],
    },
    treatmentsTitle: 'Our Scalp Treatments',
    treatments: [
      {
        title: 'Regular Scalp Treatment',
        description:
          'Deep cleansing and general scalp health maintenance. Perfect for monthly care and prevention.',
        benefits: ['General scalp health', 'Gentle exfoliation', 'Removes excess oil and buildup'],
      },
      {
        title: 'Advanced Scalp Therapy',
        description:
          'Premium formulas targeting specific concerns like hair loss, severe dandruff, or extreme oiliness.',
        benefits: ['Targets hair loss', 'Targets severe dandruff', 'Targets extreme oiliness'],
      },
    ],
    faq: {
      title: 'Scalp Treatment FAQs',
      description: 'Common questions about our scalp care services.',
      questions: [
        {
          question: 'How often should I get a scalp treatment?',
          answer:
            'For maintenance and general scalp health, we recommend monthly treatments. If addressing specific concerns like severe dandruff, excessive oiliness, or hair loss, you may benefit from bi-weekly treatments for the first 4-6 weeks, then transitioning to monthly maintenance.',
        },
        {
          question: 'Will scalp treatment help with hair loss?',
          answer:
            "While scalp treatments can't reverse genetic hair loss, they create optimal conditions for hair growth by improving blood circulation, removing buildup that blocks follicles, and delivering nutrients to the scalp. Many clients notice improved hair thickness and reduced shedding with regular treatments. For significant hair loss concerns, we recommend consulting a dermatologist.",
        },
        {
          question: 'Is scalp treatment suitable for sensitive scalps?',
          answer:
            'Yes! We can customize treatments specifically for sensitive scalps using gentle, soothing formulas without harsh ingredients. Let us know about your sensitivity during consultation so we can select the most appropriate products and techniques.',
        },
        {
          question: 'Can I get a scalp treatment if I have colored hair?',
          answer:
            'Absolutely. Scalp treatments focus on the scalp and roots rather than the hair lengths, and we use color-safe products. In fact, scalp treatments can help maintain color vibrancy by creating a healthier environment for hair growth and reducing the need for harsh clarifying shampoos.',
        },
        {
          question: "What's the difference between regular and advanced scalp therapy?",
          answer:
            'Our regular Scalp Treatment provides deep cleansing and general scalp health maintenance using quality formulas. The Advanced Scalp Therapy uses premium formulas specifically targeting concerns like hair loss, severe dandruff, or extreme oiliness, and includes optional treatment ampoule boosts for intensified results.',
        },
      ],
    },
    cta: {
      title: 'Ready for a Healthier Scalp?',
      description:
        "Book a scalp analysis and treatment today. We'll diagnose your scalp condition and recommend the perfect care plan.",
      button: 'Book Scalp Treatment',
    },
    process: {
      title: 'The Treatment Journey',
      steps: [
        {
          number: '1',
          title: 'Consultation & Analysis',
          description:
            'We begin with a thorough scalp analysis using a microscopic scanner to identify your specific condition and needs.',
        },
        {
          number: '2',
          title: 'Preparation',
          description:
            'A gentle brushing stimulates blood flow and loosens debris, preparing your scalp for deep cleansing.',
        },
        {
          number: '3',
          title: 'Deep Cleansing',
          description:
            'We apply a specialized pre-shampoo treatment to exfoliate and dissolve buildup, followed by a purifying wash.',
        },
        {
          number: '4',
          title: 'Treatment Application',
          description:
            'Targeted serums or masks are applied and massaged into the scalp to nourish follicles and address specific concerns.',
        },
        {
          number: '5',
          title: 'Finish',
          description:
            'We finish with a relaxing massage to improve circulation and absorption, followed by a professional blow-dry.',
        },
      ],
    },
    aftercare: {
      title: 'Aftercare Tips',
      tips: [
        {
          title: 'Avoid Washing for 24h',
          text: 'Allow the treatment ingredients to fully absorb and work their magic by waiting at least 24 hours before your next wash.',
        },
        {
          title: 'Use Gentle Products',
          text: "Switch to sulfate-free, scalp-friendly shampoos that won't strip away natural oils or irritate your freshly treated scalp.",
        },
        {
          title: 'Watch Water Temperature',
          text: 'Wash with lukewarm water. Hot water can strip moisture and trigger oil production, while cold water may not cleanse effectively.',
        },
        {
          title: 'Protect from Sun',
          text: 'Your scalp may be more sensitive after exfoliation. Wear a hat or use SPF hair products if spending time outdoors.',
        },
      ],
    },
  },
  zh: {
    hero: {
      badge: '头皮护理',
      headline: '全面头皮健康',
      subheading: '健康的头发始于健康的头皮。通过我们先进的治疗护理，从根源解决问题。',
    },
    stats: {
      type: { label: '护理类型', value: '头皮护理' },
      maintenance: { label: '频率', value: '每月保养' },
      duration: { label: '时长', value: '60-90分钟' },
    },
    overview: {
      title: '为何头皮护理重要',
      subtitle: '油性、头屑和脱发等问题往往源于堵塞或不平衡的头皮。我们的护理深层清洁并滋养毛囊。',
    },
    problems: [
      { title: '油性头皮', solution: '调节皮脂分泌以防止油腻和毛孔堵塞。' },
      { title: '脱发', solution: '刺激血液循环并强化发根以减少脱落。' },
      { title: '敏感/瘙痒', solution: '舒缓炎症并恢复头皮的天然保护屏障。' },
      { title: '头屑和脱屑', solution: '针对性配方从根源有效解决脱屑问题。' },
    ],
    treatmentsTitle: '我们的头皮护理',
    treatments: [
      {
        title: '常规头皮护理',
        price: '$88',
        description: '深层清洁和一般头皮健康维护。最适合每月护理和预防。',
        benefits: ['深层清洁', '油脂平衡', '温和去角质'],
      },
      {
        title: '高级头皮疗程',
        price: '$128',
        description: '高级配方针对脱发、严重头屑或极度油性等特定问题。',
        benefits: ['高级成分', '护理安瓶增强', '针对性解决方案'],
      },
      {
        title: '头皮+角蛋白组合',
        price: '$248',
        description: '完整发质健康套餐。头皮护理后进行角蛋白顺滑，提供全面护理。',
        benefits: ['全面护理', '头皮+发质护理', '最大效果'],
      },
    ],
    faq: {
      title: '头皮护理常见问题',
      description: '关于我们头皮护理服务的常见问题。',
      questions: [
        {
          question: '应该多久做一次头皮护理？',
          answer:
            '为了保养和一般头皮健康，我们建议每月护理一次。如果要解决严重头屑、过度油性或脱发等特定问题，您可能会在前4-6周从每两周护理一次中受益，然后过渡到每月保养。',
        },
        {
          question: '头皮护理会帮助解决脱发吗？',
          answer:
            '虽然头皮护理无法逆转遗传性脱发，但它们通过改善血液循环、去除阻塞毛囊的堆积物以及向头皮输送营养，为头发生长创造最佳条件。许多客户通过定期护理注意到发质厚度改善和脱发减少。对于严重的脱发问题，我们建议咨询皮肤科医生。',
        },
        {
          question: '头皮护理适合敏感头皮吗？',
          answer:
            '是的！我们可以使用温和、舒缓且不含刺激性成分的配方专门为敏感头皮定制护理。在咨询时告诉我们您的敏感情况，以便我们选择最合适的产品和技术。',
        },
        {
          question: '染过发能做头皮护理吗？',
          answer:
            '完全可以。头皮护理专注于头皮和发根而非发长，我们使用护色产品。事实上，头皮护理可以通过为头发生长创造更健康的环境并减少使用刺激性清洁洗发水的需要，帮助保持发色鲜艳。',
        },
        {
          question: '常规头皮护理和高级头皮疗程有何区别？',
          answer:
            '我们的常规头皮护理使用优质配方提供深层清洁和一般头皮健康维护。高级头皮疗程使用高级配方专门针对脱发、严重头屑或极度油性等问题，并包括可选的护理安瓶增强以获得加强效果。',
        },
      ],
    },
    cta: {
      title: '准备好拥有更健康的头皮了吗？',
      description: '立即预约头皮分析和护理。我们将诊断您的头皮状况并推荐完美的护理方案。',
      button: '预约头皮护理',
    },
    process: {
      title: '护理流程',
      steps: [
        {
          number: '1',
          title: '咨询与分析',
          description: '我们首先使用显微扫描仪进行彻底的头皮分析，以确定您的具体状况和需求。',
        },
        {
          number: '2',
          title: '准备',
          description: '温和的梳理刺激血液流动并松动杂质，为深层清洁做好准备。',
        },
        {
          number: '3',
          title: '深层清洁',
          description: '我们使用专门的预洗护理来去角质和溶解堆积物，然后进行净化清洗。',
        },
        {
          number: '4',
          title: '护理涂抹',
          description: '涂抹针对性的精华液或发膜并按摩入头皮，以滋养毛囊并解决特定问题。',
        },
        {
          number: '5',
          title: '完成',
          description: '我们最后进行放松按摩以改善循环和吸收，然后进行专业吹风造型。',
        },
      ],
    },
    aftercare: {
      title: '护理后提示',
      tips: [
        {
          title: '24小时内避免洗头',
          text: '在下次洗头前等待至少24小时，让护理成分充分吸收并发挥作用。',
        },
        {
          title: '使用温和产品',
          text: '改用无硫酸盐、对头皮友好的洗发水，不会剥离天然油脂或刺激刚护理过的头皮。',
        },
        {
          title: '注意水温',
          text: '用温水洗头。热水会剥离水分并引发油脂分泌，而冷水可能无法有效清洁。',
        },
        {
          title: '防晒',
          text: '去角质后您的头皮可能更敏感。如果在户外活动，请戴帽子或使用SPF护发产品。',
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
    <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-1">
      <Plus className="w-5 h-5 rotate-45" />
    </div>
    <div>
      <Text className="block font-bold text-stone-900 mb-1">{problem}</Text>
      <Text className="text-stone-600 text-sm">{solution}</Text>
    </div>
  </div>
);

const ProcessStep = ({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) => (
  <div className="flex gap-6 items-start">
    <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center font-serif font-bold shrink-0 border border-teal-200">
      {number}
    </div>
    <div>
      <Heading size="4" className="mb-2 text-stone-900">
        {title}
      </Heading>
      <Text className="text-stone-600 text-md leading-relaxed">{description}</Text>
    </div>
  </div>
);

const MaintenanceTip = ({ title, text }: { title: string; text: string }) => (
  <div className="bg-stone-100 p-6 rounded-xl">
    <Heading size="4" className="mb-2 text-stone-900">
      {title}
    </Heading>
    <Text className="text-stone-600 text-md">{text}</Text>
  </div>
);

// --- Main Page ---

export default function ScalpTreatmentPage() {
  // Get static content for scalp treatment service
  const serviceContent = getServiceContent('scalp-treatment');

  // We don't error if serviceContent is missing for now as we have inline content,
  // but in a real app we might want to use it or fallback.
  // if (!serviceContent) notFound();

  const servicePrice = 'From $88';

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[65vh] min-h-[550px] w-full overflow-hidden">
        <Image
          src="/background-images/scalp-treatment.png"
          alt="Scalp Treatments at Signature Trims"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-white/30 flex items-center justify-center">
          <Container size="4" className="text-center text-white px-4">
            <Badge
              size="3"
              color="cyan"
              variant="solid"
              className="mb-6 px-4 py-1 uppercase tracking-widest font-sans bg-cyan-600/90 backdrop-blur-sm"
            >
              {content.hero.badge}
            </Badge>
            <Heading
              size="9"
              className="font-serif font-light mb-6 text-5xl md:text-7xl leading-tight whitespace-pre-line"
            >
              {content.hero.headline}
            </Heading>
            <p className="text-xl font-light opacity-95 max-w-2xl mx-auto leading-relaxed font-sans">
              {content.hero.subheading}
            </p>
          </Container>
        </div>
      </div>

      {/* Stats */}
      <Container size="3" className="px-6 md:px-12 -mt-20 relative z-10 mb-24">
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-stone-100">
          <Grid
            columns={{ initial: '1', md: '3' }}
            gap="8"
            className="text-center divide-y md:divide-y-0 md:divide-x divide-stone-100"
          >
            <div className="px-4 pt-8 md:pt-0">
              <Text className="block text-stone-400 text-sm uppercase tracking-widest mb-2">
                {content.stats.maintenance.label}
              </Text>
              <Text className="block text-lg font-serif text-stone-900">
                {content.stats.maintenance.value}
              </Text>
            </div>
            <div className="px-4 pt-8 md:pt-0">
              <Text className="block text-stone-400 text-sm uppercase tracking-widest mb-2">
                {content.stats.duration.label}
              </Text>
              <Text className="block text-lg font-serif text-stone-900">
                {content.stats.duration.value}
              </Text>
            </div>
            <div className="px-4 pt-8 md:pt-0">
              <Text className="block text-stone-400 text-sm uppercase tracking-widest mb-2">
                Price
              </Text>
              <Text className="block text-lg font-serif text-stone-900">{servicePrice}</Text>
            </div>
          </Grid>
        </div>
      </Container>

      {/* About Scalp Care Section */}
      <Container size="4" className="px-6 md:px-12 py-16 bg-stone-50">
        <Container size="4" className="px-6 md:px-12 py-16 bg-white md:rounded-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
            {/* Why Hair Scalp Treatment? */}
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
                beforeImage="/images/before-after/scalp-before.png"
                afterImage="/images/before-after/scalp-after.png"
                beforeLabel="Before Treatment"
                afterLabel="After Treatment"
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
        <Grid columns={{ initial: '1', md: '2' }} gap="6">
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

      {/* FAQ Sections */}
      <div className="py-16 bg-stone-50">
        <Container size="3" className="px-6 md:px-12">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <Heading size="8" className="font-serif text-stone-900 mb-4">
                {content.faq.title}
              </Heading>
              <Text className="text-stone-500">{content.faq.description}</Text>
            </div>
            <Accordion type="single" collapsible className="space-y-4">
              {content.faq.questions.map((item, index) => (
                <AccordionItem
                  key={index}
                  value={`scalp-${index}`}
                  className="border border-stone-200 rounded-2xl px-6 bg-white"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-6">
                    <Heading size="5" className="font-serif text-stone-900">
                      {item.question}
                    </Heading>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    <Text className="text-stone-600 leading-relaxed">{item.answer}</Text>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Container>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-stone-900 text-white">
        <Container size="3" className="px-6 md:px-12">
          <div className="text-center max-w-2xl mx-auto">
            <Heading size="8" className="font-serif mb-6">
              {content.cta.title}
            </Heading>
            <Text className="text-stone-300 text-lg mb-8 leading-relaxed">
              {content.cta.description}
            </Text>
          </div>
        </Container>
      </div>

      {/* Booking Section */}
      <ServiceBookingWrapper serviceName="Scalp Treatment" />
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: 'Scalp Treatments | Signature Trims',
    description:
      'Restore health to your scalp with our range of therapeutic treatments. Address oiliness, dandruff, and hair loss.',
  };
}
