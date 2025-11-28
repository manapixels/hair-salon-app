import React from 'react';
import { Heading, Text, Container, Grid } from '@radix-ui/themes';
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

// Bilingual Content - Inline
const CONTENT = {
  en: {
    hero: {
      badge: 'Colouring & Highlights',
      headline: 'Colour Done Right',
      subheading:
        'Transform your look with rich, dimensional colour. From subtle enhancements to bold transformations—expertly crafted for you.',
    },
    stats: {
      maintenance: { label: 'Maintenance', value: '4 to 8 Weeks (touch-up)' },
      duration: { label: 'Duration', value: '2 to 3 Hours' },
    },
    overview: {
      title: 'Choose Your Colours',
      subtitle:
        'From subtle enhancements to bold transformations, we offer a complete range of colouring techniques.',
      whatIsIt:
        'Professional hair colouring service that transforms your look with vibrant, long-lasting results. Using premium low-ammonia formulas, we expertly apply colour to cover grays, enhance your natural shade, or create a bold new look. Each colouring session is customized to your hair type, desired outcome, and lifestyle needs.',
      whoIsItFor:
        "Perfect for anyone looking to refresh their current colour, cover gray hair, or make a dramatic change. Whether you're seeking subtle enhancement or a complete transformation, we work with you to achieve the perfect shade that complements your skin tone and personal style.",
      whyChoose:
        "Our gentle, low-ammonia Japanese formulas protect hair health while delivering rich, dimensional colour that lasts. With expert shade matching and professional application, you'll enjoy beautiful, even coverage and vibrant results every time.",
    },
    types: [
      {
        title: 'Full Head Colour',
        description:
          'Complete colour application from roots to ends. Perfect for dramatic changes or refreshing faded colour throughout.',
        image: '/colour-types/full-head-colour.png',
      },

      {
        title: 'Creative Colours',
        description:
          'Bold, creative colours including pastels, vivids, and unique shades. Express your personality with standout colour.',
        image: '/colour-types/creative-colours.png',
      },
      {
        title: 'Airtouch',
        description: 'Seamless blending using air for the most natural-looking blonde.',
        image: '/colour-types/airtouch.png',
      },
      {
        title: 'Ombré Colour',
        description:
          'Gradual transition from darker roots to lighter ends. Creates a modern, dimensional look with built-in grow-out.',
        image: '/colour-types/ombre.png',
      },
      {
        title: 'Highlights',
        description: 'Add dimension and brightness with strategically placed lighter strands.',
        image: '/colour-types/highlights.png',
      },
      {
        title: 'Blondes & Silvers',
        description: 'Expert bleaching and toning for the perfect platinum or cool silver.',
        image: '/colour-types/blondes-and-silvers.png',
      },
      {
        title: 'Gray Blending',
        description:
          'Strategic colour placement that softens gray coverage for a natural, low-maintenance look with dimension.',
        image: '/colour-types/gray-blending.png',
      },
      {
        title: 'Root Touch-Up',
        description:
          'Colours only new growth (1-2 inches at roots). Ideal for maintaining your existing colour between full applications.',
        image: '/colour-types/root-touch-up.png',
      },
    ],
    process: {
      title: 'The Colouring Journey',
      subtitle: 'What to expect during your visit',
      steps: [
        {
          number: '1',
          title: 'Consultation',
          description:
            "We discuss your colour goals, assess your hair's current condition, and recommend the perfect shade. We'll show you swatches and discuss maintenance.",
        },
        {
          number: '2',
          title: 'Preparation',
          description:
            'For first-time clients or significant changes, we perform a strand test. Your hair is then prepared and protected for the colouring process.',
        },
        {
          number: '3',
          title: 'Application',
          description:
            'Your colorist applies the custom-mixed formula with precision, ensuring even coverage from roots to ends for optimal brilliance.',
        },
        {
          number: '4',
          title: 'Processing',
          description:
            'The colour develops for the optimal time based on your hair type and desired result. We monitor to ensure perfect colour development.',
        },
        {
          number: '5',
          title: 'Finish',
          description:
            'Your hair is gently rinsed, followed by a color-sealing treatment and optional toner. We finish with a professional blow-dry and style.',
        },
      ],
    },
    aftercare: {
      title: 'Aftercare Tips',
      tips: [
        {
          title: 'Wait Before Washing',
          text: 'Avoid shampooing your hair for at least 48 hours after coloring. This allows the dye to fully set, locking in vibrancy and reducing early fading.',
        },
        {
          title: 'Use Color-Safe Products',
          text: 'Switch to sulfate-free, color-safe shampoo and conditioner. These gentle formulas help preserve your new color and maintain hair health.',
        },
        {
          title: 'Limit Heat Styling',
          text: 'Minimize use of hot tools like irons and blowdryers in the first week. When styling, always use a heat protectant spray.',
        },
        {
          title: 'Deep Condition Weekly',
          text: 'Apply a nourishing hair mask or deep conditioner once a week to replenish moisture and maintain shine after chemical processing.',
        },
        {
          title: 'Protect From Sun & Chlorine',
          text: 'Wear a hat outdoors to shield hair from UV rays, which can fade color. Rinse and protect hair before swimming in chlorinated pools.',
        },
        {
          title: 'Refresh With Toner',
          text: 'Consider a professional toner or gloss every 4–6 weeks to keep your color fresh and counteract brassiness or fading.',
        },
      ],
    },
    faq: {
      title: 'Frequently Asked Questions',
      description: 'Common questions about our hair colouring services.',
      questions: [
        {
          question: 'How long does hair color last?',
          answer:
            'With proper care, professional hair color typically lasts 4-6 weeks before requiring a root touch-up. The vibrancy of the color gradually fades over 6-8 weeks. Using color-safe shampoo and conditioner can extend the life of your color significantly.',
        },
        {
          question: 'Will colouring damage my hair?',
          answer:
            'Our gentle, low-ammonia Japanese formulas are designed to minimize damage while delivering beautiful results. We also include conditioning treatments to protect and nourish your hair during the colouring process. However, any chemical process does affect hair structure, which is why we recommend regular deep conditioning treatments.',
        },
        {
          question: "Can I color my hair if it's already been treated?",
          answer:
            "Yes, but we need to assess your hair's condition first. If you've recently had other chemical treatments like perms or relaxers, we may recommend waiting or using alternative colouring methods. During your consultation, please inform us of any previous treatments.",
        },
        {
          question: 'How do I choose the right color?',
          answer:
            "We'll help you select the perfect shade based on your skin tone, eye color, lifestyle, and maintenance preferences. We'll show you color swatches and can perform a strand test if you're unsure. We recommend bringing inspiration photos to your consultation.",
        },
        {
          question: "What's the difference between root touch-up and full color?",
          answer:
            'A root touch-up colors only the new growth at your roots (typically 1-2 inches), perfect for maintaining your existing color. A full color service colors your entire head of hair, ideal for changing your color completely or refreshing faded color throughout.',
        },
      ],
    },
    cta: {
      title: 'Discover Your Perfect Shade',
      description:
        "Schedule a colour consultation. We'll help you find the ideal colour for your unique style.",
      button: 'Book Your Colour Appointment',
    },
  },
  zh: {
    hero: {
      badge: '染发与挑染',
      headline: '完美染发',
      subheading: '用丰富立体的色彩改变您的形象。从微妙提升到大胆转变——为您专业打造。',
    },
    stats: {
      maintenance: { label: '维护周期', value: '4至8周（补染）' },
      duration: { label: '时长', value: '2至3小时' },
    },
    overview: {
      title: '选择您的色彩',
      subtitle: '从微妙提升到大胆转变，我们提供全方位的染发技术。',
      whatIsIt:
        '专业染发服务，用鲜艳持久的效果改变您的形象。使用高级低氨配方，精准上色以遮盖白发、提升自然色调或打造大胆新造型。每次染发都根据您的发质、期望效果和生活方式需求量身定制。',
      whoIsItFor:
        '最适合想要刷新当前发色、遮盖白发或进行戏剧性改变的人群。无论您追求微妙提升还是彻底转变，我们都会与您合作，打造完美衬托您肤色和个人风格的色调。',
      whyChoose:
        '我们温和的低氨日本配方在呈现丰富立体持久色彩的同时，保护发质健康。凭借专业的色调匹配和专业的上色技术，您每次都能享受美丽均匀的覆盖效果和鲜艳的成果。',
    },
    types: [
      {
        title: '全头染色',
        description: '从发根到发尾全面上色。最适合戏剧性改变或刷新全头褪色效果。',
        image: '/colour-types/full-head-colour.png',
      },
      {
        title: '创意色彩',
        description: '大胆创意色彩，包括粉彩、鲜艳色和独特色调。用出众的色彩表达您的个性。',
        image: '/colour-types/creative-colours.png',
      },
      {
        title: 'Airtouch',
        description: '使用空气无缝融合，打造最自然的金发效果。',
        image: '/colour-types/airtouch.png',
      },
      {
        title: '渐变染色',
        description: '从深色发根渐变至浅色发尾。打造现代立体造型，自带长发效果。',
        image: '/colour-types/ombre.png',
      },
      {
        title: '挑染',
        description: '通过策略性地放置浅色发束，增添层次感和亮度。',
        image: '/colour-types/highlights.png',
      },
      {
        title: '金发与银发',
        description: '专业漂色和调色，打造完美的铂金或冷银色。',
        image: '/colour-types/blondes-and-silvers.png',
      },
      {
        title: '白发融合',
        description: '策略性的染色布局，柔化白发覆盖效果，打造自然低维护的立体造型。',
        image: '/colour-types/gray-blending.png',
      },
      {
        title: '发根补染',
        description: '仅为发根的新长部分（通常1-2英寸）上色。最适合在全头染色之间保持现有发色。',
        image: '/colour-types/root-touch-up.png',
      },
    ],
    process: {
      title: '染发之旅',
      subtitle: '您的服务体验',
      steps: [
        {
          number: '1',
          title: '咨询',
          description:
            '我们将与您讨论染发目标，评估您当前的发质状况，并推荐完美的色调。我们会向您展示色板并讨论后续保养。',
        },
        {
          number: '2',
          title: '准备',
          description:
            '对于初次客户或重大改变，我们会进行发束测试。然后为您的头发做好染色前的准备和保护。',
        },
        {
          number: '3',
          title: '上色',
          description: '发型师精准涂抹定制调配的染料，确保从发根到发尾均匀覆盖，呈现最佳光泽度。',
        },
        {
          number: '4',
          title: '处理',
          description:
            '根据您的发质和期望效果，染料在最佳时间内显色。我们会监测以确保完美的显色效果。',
        },
        {
          number: '5',
          title: '完成',
          description: '轻柔冲洗您的头发，然后进行锁色护理和可选的调色。最后进行专业吹风造型。',
        },
      ],
    },
    aftercare: {
      title: '护理建议',
      tips: [
        {
          title: '等待后再洗发',
          text: '染发后至少48小时内避免洗发。这让染料充分固定，锁住鲜艳度并减少早期褪色。',
        },
        {
          title: '使用护色产品',
          text: '改用无硫酸盐、护色洗发水和护发素。这些温和配方有助于保持您的新发色和头发健康。',
        },
        {
          title: '减少热造型',
          text: '第一周尽量减少使用熨发器和吹风机等热工具。造型时，务必使用防热保护喷雾。',
        },
        {
          title: '每周深层护理',
          text: '每周使用一次滋养发膜或深层护发素，补充水分并保持化学处理后的光泽。',
        },
        {
          title: '防晒防氯',
          text: '户外时戴帽子保护头发免受紫外线伤害，这会导致褪色。游泳前冲洗并保护头发免受氯水伤害。',
        },
        {
          title: '定期调色',
          text: '考虑每4-6周进行一次专业调色或光泽护理，保持发色新鲜并对抗铜色或褪色。',
        },
      ],
    },
    faq: {
      title: '常见问题',
      description: '关于我们染发服务的常见问题。',
      questions: [
        {
          question: '染发能维持多久？',
          answer:
            '在正确护理下，专业染发通常可维持4-6周后才需要发根补染。色彩的鲜艳度会在6-8周内逐渐褪色。使用护色洗护产品可显著延长发色寿命。',
        },
        {
          question: '染发会损伤头发吗？',
          answer:
            '我们温和的低氨日本配方旨在将损伤降到最低，同时呈现美丽效果。我们还包括护理程序，在染发过程中保护和滋养您的头发。但是，任何化学过程都会影响发质结构，因此我们建议定期进行深层护理。',
        },
        {
          question: '如果头发已经做过处理，还能染发吗？',
          answer:
            '可以，但我们需要先评估您的发质状况。如果您最近做过烫发或拉直等其他化学处理，我们可能会建议等待或使用替代染发方法。在咨询时，请告知我们您之前的任何处理。',
        },
        {
          question: '如何选择合适的发色？',
          answer:
            '我们会根据您的肤色、眼睛颜色、生活方式和保养偏好，帮助您选择完美的色调。我们会向您展示色板，如果您不确定，还可以进行发束测试。我们建议您在咨询时带上灵感照片。',
        },
        {
          question: '发根补染和全头染色有何区别？',
          answer:
            '发根补染仅为发根的新长部分（通常1-2英寸）上色，最适合保持现有发色。全头染色服务为整个头发上色，最适合彻底改变发色或刷新全头褪色效果。',
        },
      ],
    },
    cta: {
      title: '发现您的完美色调',
      description: '预约染发咨询。我们将帮助您找到最适合您独特风格的色彩。',
      button: '立即预约染发',
    },
  },
};

// TODO: Implement i18n context for language switching
// For now, using English content
const content = CONTENT.en;

// --- Main Page ---

export default function HairColouringPage() {
  // Get static content for hair colouring service
  const serviceContent = getServiceContent('hair-colouring');

  if (!serviceContent) notFound();
  const servicePrice = 'From $70';

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <ServiceHero
        backgroundImage="/background-images/hair-colouring.jpg"
        badge={{ text: content.hero.badge, color: 'mint' }}
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

      {/* Services */}
      <Container size="4" className="px-6 md:px-12 py-16 bg-white">
        <div className="text-center mb-16">
          <Heading size="8" className="font-serif text-stone-900 mb-4">
            {content.overview.title}
          </Heading>
          <Text className="text-stone-500 text-lg max-w-2xl mx-auto">
            {content.overview.subtitle}
          </Text>
        </div>
        <Grid columns={{ initial: '1', sm: '2', md: '4' }} gap="8">
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
        serviceName="Hair Colouring"
      />
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: 'Hair Colouring | Signature Trims',
    description:
      'Transform your look with our professional hair coloring service using premium low-ammonia formulas. Expert application ensures vibrant, long-lasting color.',
  };
}
