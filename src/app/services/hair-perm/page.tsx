import React from 'react';
import { Heading, Text, Container, Grid, Badge } from '@radix-ui/themes';
import Image from 'next/image';
import { Info } from '@/lib/icons';
import { notFound } from 'next/navigation';
import ServiceBookingWrapper from '@/components/services/ServiceBookingWrapper';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
      title: '流行风格',
      subtitle: '发现最适合您脸型和生活方式的完美卷发纹理。',
    },
    styles: [
      {
        title: 'C型卷烫',
        description: '发尾向内（或向外）卷曲，打造整洁、女性化的轮廓。低维护，最适合短发。',
        image: '/background-images/c-curl.jpg',
      },
      {
        title: 'S型卷烫',
        description: '打造全头蓬松流动的S型波浪，呈现浪漫饱满的造型。',
        image: '/background-images/s-curl.jpg',
      },
      {
        title: '韩式数码烫',
        description: '使用加热打造明确、弹性的卷发，干发时效果最佳。模仿卷发棒造型效果。',
        image: '/background-images/digital-perm.jpg',
      },
      {
        title: '发根蓬松烫',
        description: '专注于提升发根以增加高度和质感，不烫发长。',
        image: '/background-images/root-perm.jpg',
      },
      {
        title: '海滩波浪',
        description: '凌乱、有质感的波浪，呈现轻松的"刚离开海滩"氛围。',
        image: '/background-images/beach-wave.jpg',
      },
      {
        title: '男士烫发',
        description: '为短发增添质感和蓬松感，使造型更轻松更有活力。',
        image: '/background-images/mens-perm.jpg',
      },
    ],
    care: {
      before: {
        title: '预约前准备',
        tips: [
          '预约前避免漂发。漂过的头发通常太脆弱，不适合烫发。',
          '带上您期望卷发紧度的参考照片。',
          '预留3-4小时的时间，尤其是数码烫。',
        ],
      },
      after: {
        title: '护理建议',
        tips: [
          '等待48小时再洗头，让卷发定型。',
          '使用宽齿梳或手指梳理，绝不要用细梳。',
          '吹干时扭转头发（数码烫）以增强形状。',
          '将卷发增强产品涂抹在湿发上，自然风干或扩散吹干。',
          '使用真丝或缎面枕套睡觉，减少毛躁。',
        ],
      },
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

// --- Local Components ---

const PermTypeCard = ({
  title,
  description,
  image,
}: {
  title: string;
  description: string;
  image: string;
}) => (
  <div className="group">
    <div className="relative h-80 w-full overflow-hidden rounded-2xl mb-4">
      <Image
        src={image}
        alt={title}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
      <div className="absolute bottom-4 left-4 text-white">
        <Heading size="5" className="font-serif">
          {title}
        </Heading>
      </div>
    </div>
    <Text className="text-stone-600 text-md leading-relaxed block px-1">{description}</Text>
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
    <div className="w-10 h-10 rounded-full bg-base-primary/10 text-base-primary flex items-center justify-center font-serif font-bold shrink-0 border border-base-primary/50">
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

export default function HairPermPage() {
  // Get static content for hair perm service
  const serviceContent = getServiceContent('hair-perm');

  if (!serviceContent) notFound();
  const servicePrice = 'From $70';

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[70vh] min-h-[600px] w-full overflow-hidden">
        <Image
          src="/background-images/hair-perm.jpg"
          alt="Professional Hair Perm Services at Signature Trims"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-white/30 flex items-center justify-center">
          <Container size="4" className="text-center text-white px-4 mt-32">
            <Badge
              size="3"
              color="violet"
              variant="solid"
              className="mb-6 px-4 py-1 uppercase tracking-widest font-sans"
            >
              {content.hero.badge}
            </Badge>
            <Heading
              size="9"
              className="font-serif font-light mb-6 text-5xl md:text-7xl leading-tight whitespace-pre-line"
            >
              {content.hero.headline}
            </Heading>
            <p className="text-xl md:text-2xl font-light opacity-90 max-w-2xl mx-auto leading-relaxed font-sans">
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
            <PermTypeCard
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
      <Container size="3" className="px-6 md:px-12 py-16 bg-stone-50">
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
                value={`item-${index}`}
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

      {/* CTA Section */}
      <Container size="3" className="px-6 md:px-12 py-20 bg-stone-900 text-white">
        <div className="text-center max-w-2xl mx-auto">
          <Heading size="8" className="font-serif mb-6">
            {content.cta.title}
          </Heading>
          <Text className="text-stone-300 text-lg mb-8 leading-relaxed">
            {content.cta.description}
          </Text>
        </div>
      </Container>

      {/* Booking Section */}
      <ServiceBookingWrapper serviceName="Hair Perm" />
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
