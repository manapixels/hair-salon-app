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
      badge: 'Volume & Texture',
      headline: 'Beautiful Volume That Lasts',
      subheading:
        'Enjoy natural-looking volume and defined texture every day, with minimal styling and months of staying power.',
    },
    stats: {
      maintenance: { label: 'Maintenance', value: '6 to 8 Months' },
      duration: { label: 'Duration', value: '1 to 3 Hours' },
    },
    overview: {
      title: 'Types of Perms Available',
      subtitle:
        'We can do a wide variety of perm styles, and help you find the best look for your face shape and lifestyle.',
    },
    types: [
      {
        title: 'Regular Perm',
        description:
          'A traditional wave technique that creates distinct, defined curls from root to tip, offering lasting texture and volume.',
        image: '/perm-types/regular-perm.png',
      },
      {
        title: 'Digital Perm',
        description:
          'A heat-activated styling method that produces soft, natural-looking waves which become more defined when dry, mimicking a salon blowout.',
        image: '/perm-types/digital-perm.png',
      },
      {
        title: 'Iron Roots Perm',
        description:
          'Focuses on lifting the roots to add height and body to flat hair without curling the mid-lengths or ends.',
        image: '/perm-types/iron-roots-perm.png',
      },
      {
        title: 'Fringe Perm',
        description:
          'Targeted styling exclusively for the bangs to create a soft curve and volume, improving face-framing and simplifying daily styling.',
        image: '/perm-types/fringe-perm.png',
      },
      {
        title: 'Down Perm',
        description:
          'A smoothing treatment designed to relax and flatten stubborn, puffy hair on the sides or back to create a slimmer silhouette.',
        image: '/perm-types/down-perm.png',
      },
      {
        title: "Men's Perm",
        description:
          'Adds movement, volume, and texture to shorter styles, ranging from subtle waves to defined curls for easier manageability.',
        image: '/perm-types/mens-perm.png',
      },
    ],
    process: {
      title: 'The Process',
      steps: [
        {
          number: '1',
          title: 'Consultation & Hair Analysis',
          description:
            "We assess your hair's history, texture, and current condition. We discuss the desired curl size, type (wave, spiral, tight curl), and choose the appropriate rod size and perming solution strength.",
        },
        {
          number: '2',
          title: 'Shampoo & Rod Placement',
          description:
            'Hair is gently cleansed without conditioning. Sections of damp hair are carefully and precisely wrapped around perm rods, which determine the final curl pattern and size.',
        },
        {
          number: '3',
          title: 'Perming Solution Application (Softening)',
          description:
            "The waving (reducing) solution—containing ingredients like ammonium thioglycolate—is applied. This solution breaks the hair's internal disulfide bonds, making the hair pliable.",
        },
        {
          number: '4',
          title: 'Processing & Test Curls',
          description:
            'The hair is left to process for a specified time. The stylist closely monitors the chemical reaction by occasionally unwrapping a test curl to ensure the new curl formation is achieved without over-processing.',
        },
        {
          number: '5',
          title: 'Rinsing & Neutralizer Application (Fixing)',
          description:
            'The waving solution is thoroughly rinsed out (often while the rods are still in). A neutralizing solution (containing hydrogen peroxide or sodium bromate) is then applied to fix the newly formed bonds, locking the curl into its shape.',
        },
        {
          number: '6',
          title: 'Rod Removal & Final Rinse',
          description:
            'After the neutralizer has processed, the perm rods are carefully removed. The hair receives a final rinse, and a deep conditioner or moisturizing treatment is applied to restore moisture and pH balance.',
        },
      ],
    },
    aftercare: {
      title: 'Aftercare Tips',
      tips: [
        {
          title: 'The Initial Wait',
          text: 'Wait a minimum of 48 to 72 hours before washing your hair or tying it up to allow the chemical bonds in the curls to fully set and prevent them from dropping.',
        },
        {
          title: 'Gentle Detangling',
          text: 'Only use a wide-tooth comb or your fingers to gently detangle the hair. Avoid using fine brushes, which can pull the curls out and cause unnecessary frizz.',
        },
        {
          title: 'Curl-Friendly Drying (Digital Perms)',
          text: 'For digital perms, gently twist sections of your hair while blow-drying (using a diffuser attachment is best) to reinforce and enhance the spiral shape of the new curls.',
        },
        {
          title: 'Styling & Product Application',
          text: 'Apply moisturizing and curl-enhancing products (like mousse, cream, or gel) to damp hair. Avoid brushing after application. Air-dry or use a diffuser on low heat.',
        },
        {
          title: 'Frizz Reduction while Sleeping',
          text: 'Sleep on a silk or satin pillowcase. This material creates less friction, significantly reducing frizz and helping to maintain the curl definition overnight.',
        },
        {
          title: 'Use Right Products (Sulfate/Alcohol-Free)',
          text: "Commit to using only sulfate-free and alcohol-free shampoo and conditioner. Sulfates strip the hair's natural oils and can weaken the perm, causing the curls to relax prematurely.",
        },
      ],
    },
    faq: {
      title: 'Frequently Asked Questions',
      description: 'Common questions about our perm services.',
      questions: [
        {
          question: 'How long does a perm last?',
          answer:
            'A perm lasts 6-8 months on average, though results vary based on hair growth rate, texture, and how you care for it. The curls will gradually loosen over time but remain until you cut the permed hair off or grow it out. Digital perms tend to last slightly longer due to the heat-setting process.',
        },
        {
          question: "What's the difference between a digital perm and classic perm?",
          answer:
            'A digital perm uses heated rods and creates loose, natural-looking waves that mimic heat-styled curls. It works best on medium to long hair. A classic (cold) perm uses room-temperature rods and creates more defined, tighter curls that are springier when wet. Digital perms tend to look more natural and modern.',
        },
        {
          question: 'Can I perm colored or bleached hair?',
          answer:
            "It's possible, but we need to carefully assess your hair's condition first. Perming already chemically-treated hair carries higher risk of damage. We typically recommend waiting 2-3 weeks between coloring and perming, and may suggest strand tests or bond-building treatments. Very damaged or over-processed hair may not be suitable for perming.",
        },
        {
          question: 'Will a perm damage my hair?',
          answer:
            "Perming is a chemical process that alters hair structure, so some stress is inevitable. However, using quality Korean or Japanese perm solutions, proper technique, and post-perm care minimizes damage. We don't recommend perming severely damaged hair. Regular deep conditioning treatments will help maintain hair health.",
        },
        {
          question: 'How do I style permed hair?',
          answer:
            'The beauty of a perm is minimal styling! After washing, apply curl-enhancing mousse or cream to damp hair, scrunch upward, and either air-dry or diffuse on low heat. Avoid brushing dry permed hair (use fingers or a wide-tooth comb). Refresh curls between washes with a spray bottle and curl cream.',
        },
      ],
    },
    cta: {
      title: 'Ready for Effortless Curls?',
      description:
        "Book a perm consultation to explore curl options. We'll help you choose the perfect texture for your lifestyle.",
      button: 'Schedule Your Perm Consultation',
    },
  },
  zh: {
    hero: {
      badge: '蓬松与质感',
      headline: '持久的蓬松与质感。\n轻松造型。',
      subheading: '每天醒来都拥有美丽的卷发和波浪。低维护质感持续数月。',
    },
    stats: {
      maintenance: { label: '维护周期', value: '6-8个月' },
      duration: { label: '时长', value: '3-3.5小时' },
    },
    overview: {
      title: '可选烫发类型',
      subtitle: '我们可以做多种烫发风格，帮助您找到最适合您脸型和生活方式的造型。',
    },
    types: [
      {
        title: '常规烫发',
        description: '传统波浪技术，从发根到发尾打造明确定义的卷发，提供持久的质感和蓬松度。',
        image: '/perm-types/regular-perm.png',
      },
      {
        title: '数码烫',
        description: '热激活造型方法，打造柔软自然的波浪，干发时更明显，模仿沙龙吹风效果。',
        image: '/perm-types/digital-perm.png',
      },
      {
        title: '发根烫',
        description: '专注于提升发根以增加高度和蓬松度，不卷发中段或发尾，适合扁塌头发。',
        image: '/perm-types/iron-roots-perm.png',
      },
      {
        title: '刘海烫',
        description: '专门为刘海造型，打造柔和的弧度和蓬松感，改善脸部轮廓并简化日常造型。',
        image: '/perm-types/fringe-perm.png',
      },
      {
        title: '下压烫',
        description: '顺滑护理，旨在放松和抚平两侧或后部顽固蓬松的头发，打造更纤瘦的轮廓。',
        image: '/perm-types/down-perm.png',
      },
      {
        title: '男士烫发',
        description: '为短发增添动感、蓬松度和质感，从微妙波浪到明确卷发，更易打理。',
        image: '/perm-types/mens-perm.png',
      },
    ],
    process: {
      title: '服务流程',
      steps: [
        {
          number: '1',
          title: '咨询与发质分析',
          description:
            '我们评估您的头发历史、质地和当前状况。讨论期望的卷发大小、类型（波浪、螺旋、紧卷），并选择合适的卷棒大小和烫发液强度。',
        },
        {
          number: '2',
          title: '洗发与卷棒定位',
          description:
            '轻轻清洗头发，不使用护发素。将潮湿的头发分区，仔细精确地缠绕在烫发棒上，这决定了最终的卷发图案和大小。',
        },
        {
          number: '3',
          title: '烫发液涂抹（软化）',
          description:
            '涂抹烫发液（还原液）——含有硫基乙酸铵等成分。这种溶液打破头发内部的二硫键，使头发变得柔韧。',
        },
        {
          number: '4',
          title: '处理与测试卷',
          description:
            '头发放置指定时间进行处理。发型师通过偶尔解开测试卷来密切监测化学反应，确保形成新卷发而不会过度处理。',
        },
        {
          number: '5',
          title: '冲洗与中和剂涂抹（定型）',
          description:
            '彻底冲洗烫发液（通常在卷棒仍在时）。然后涂抹中和液（含过氧化氢或溴酸钠）以固定新形成的键，锁定卷发形状。',
        },
        {
          number: '6',
          title: '卷棒拆除与最后冲洗',
          description:
            '中和剂处理后，小心取下烫发棒。头发接受最后冲洗，涂抹深层护发素或保湿护理以恢复水分和pH平衡。',
        },
      ],
    },
    aftercare: {
      title: '护理建议',
      tips: [
        {
          title: '初始等待期',
          text: '至少等待48-72小时再洗头或扎头发，让卷发中的化学键充分定型，防止卷度下垂。',
        },
        {
          title: '温柔梳理',
          text: '仅使用宽齿梳或手指轻柔梳理头发。避免使用细梳，会拉直卷发并造成不必要的毛躁。',
        },
        {
          title: '卷发友好吹干（数码烫）',
          text: '对于数码烫，吹干时轻轻扭转头发（最好使用扩散器附件）以增强和提升螺旋形新卷发。',
        },
        {
          title: '造型与产品应用',
          text: '将保湿和卷发增强产品（如慕斯、乳霜或啫喱）涂抹在湿发上。涂抹后避免梳理。自然风干或用低热扩散器吹干。',
        },
        {
          title: '睡眠时减少毛躁',
          text: '睡在真丝或缎面枕套上。这种材质摩擦较小，显著减少毛躁，有助于保持卷发定义过夜。',
        },
        {
          title: '使用正确产品（无硫酸盐/无酒精）',
          text: '承诺只使用无硫酸盐和无酒精的洗发水和护发素。硫酸盐会剥离头发的天然油脂，削弱烫发，导致卷发过早松弛。',
        },
      ],
    },
    faq: {
      title: '常见问题',
      description: '关于我们烫发服务的常见问题。',
      questions: [
        {
          question: '烫发能维持多久？',
          answer:
            '烫发平均可维持6-8个月，但效果因头发生长速度、质地和护理方式而异。卷发会随时间逐渐松弛，但会一直保持直到您剪掉或长出烫过的头发。数码烫由于热定型过程，往往能维持更久。',
        },
        {
          question: '数码烫和传统烫有何区别？',
          answer:
            '数码烫使用加热卷发棒，打造蓬松、自然的波浪，模仿热造型卷发效果。最适合中长发。传统（冷）烫使用室温卷发棒，打造更明确、更紧致的卷发，湿发时更有弹性。数码烫往往看起来更自然现代。',
        },
        {
          question: '染过色或漂过的头发能烫吗？',
          answer:
            '可以，但我们需要先仔细评估您的发质状况。为已经化学处理过的头发烫发会有更高的损伤风险。我们通常建议在染发和烫发之间等待2-3周，并可能建议进行发束测试或键合修复护理。损伤严重或过度处理的头发可能不适合烫发。',
        },
        {
          question: '烫发会损伤头发吗？',
          answer:
            '烫发是改变头发结构的化学过程，因此一些损伤不可避免。但是，使用优质的韩国或日本烫发液、正确的技术和烫后护理可将损伤降到最低。我们不建议为严重损伤的头发烫发。定期深层护理将有助于保持发质健康。',
        },
        {
          question: '如何造型烫发？',
          answer:
            '烫发的美妙之处在于极少造型！洗头后，将卷发增强慕斯或乳霜涂抹在湿发上，向上抓揉，然后自然风干或用低热扩散吹干。避免梳理干燥的烫发（用手指或宽齿梳）。两次洗头之间用喷雾瓶和卷发乳霜刷新卷度。',
        },
      ],
    },
    cta: {
      title: '准备好拥有轻松卷发了吗？',
      description: '预约烫发咨询，探索卷发选择。我们将帮助您选择最适合您生活方式的质感。',
      button: '立即预约烫发咨询',
    },
  },
};

// TODO: Implement i18n context for language switching
// For now, using English content
const content = CONTENT.en;

// --- Main Page ---

export default function HairPermPage() {
  // Get static content for hair perm service
  const serviceContent = getServiceContent('hair-perm');

  if (!serviceContent) notFound();
  const servicePrice = 'From $70';

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <ServiceHero
        backgroundImage="/background-images/hair-perm.jpg"
        badge={{ text: content.hero.badge, color: 'amber' }}
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
          Achieve the perfect curls you&apos;ve always desired with our expert perm services.
          Whether you have fine, straight hair or want to elevate your natural waves, we are here to
          bring your vision to life. We specialize in creating beautifully defined curls and waves
          that tailor perfectly to your style, delivering lasting texture, volume, and movement.
        </p>
      </Container>

      {/* Perm Types */}
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
                  colorScheme="amber"
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
        serviceName="Hair Perm"
      />
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: 'Hair Perm | Signature Trims',
    description:
      'Create lasting volume and texture with our professional perm services. Choose from Korean Digital Perms, C-Curls, S-Curls, and more.',
  };
}
