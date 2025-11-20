import { ServiceContent } from '@/components/ServiceDetailSections';

export const serviceContentMap: Record<string, ServiceContent> = {
  'hair-colouring': {
    serviceName: 'Hair Colouring',
    overview: {
      whatIsIt:
        'Our professional hair coloring service transforms your look with vibrant, long-lasting results. Using premium low-ammonia formulas from Japan, we expertly apply color to cover grays, enhance your natural shade, or create a bold new look. Each coloring session is customized to your hair type, desired outcome, and lifestyle needs.',
      whoIsItFor:
        "Perfect for anyone looking to refresh their current color, cover gray hair, or make a dramatic change. Whether you're seeking subtle enhancement or a complete transformation, our experienced colorists work with you to achieve the perfect shade that complements your skin tone and personal style.",
      keyFeature:
        'Our gentle, low-ammonia Japanese formulas protect hair health while delivering rich, dimensional color that lasts.',
    },
    benefits: [
      {
        title: 'Rich, Long-Lasting Color',
        description:
          'Our professional formulas ensure vibrant color that resists fading and maintains its brilliance for weeks.',
      },
      {
        title: 'Customized Shade Matching',
        description:
          'Expert colorists blend custom shades to perfectly match your desired look and skin undertones.',
      },
      {
        title: 'Gentle on Hair & Scalp',
        description:
          'Low-ammonia Japanese formulas minimize damage while delivering beautiful, even coverage.',
      },
      {
        title: 'Gray Coverage Perfection',
        description:
          'Complete gray coverage with natural-looking results that blend seamlessly with your existing hair.',
      },
      {
        title: 'Versatile Color Options',
        description: 'From natural shades to fashion colors, we can create any look you envision.',
      },
      {
        title: 'Professional Application',
        description:
          'Precise technique ensures even color distribution from root to tip for flawless results.',
      },
    ],
    processSteps: [
      {
        number: 1,
        title: 'Color Consultation',
        description:
          "We begin with a thorough consultation to understand your color goals, assess your hair's current condition, and recommend the perfect shade. Our colorists will show you color swatches and discuss maintenance requirements.",
        duration: '10-15 min',
      },
      {
        number: 2,
        title: 'Strand Test & Preparation',
        description:
          'For first-time clients or significant color changes, we perform a strand test to ensure the perfect result. Your hair is then prepared and protected for the coloring process.',
        duration: '5-10 min',
      },
      {
        number: 3,
        title: 'Color Application',
        description:
          'Our expert colorists apply the custom-mixed formula with precision, ensuring even coverage from roots to ends. We use professional techniques to achieve optimal color penetration and brilliance.',
        duration: '30-45 min',
      },
      {
        number: 4,
        title: 'Processing & Development',
        description:
          'The color is allowed to develop for the optimal time based on your hair type and desired result. We monitor the process to ensure perfect color development.',
        duration: '20-30 min',
      },
      {
        number: 5,
        title: 'Rinse, Tone & Style',
        description:
          'Your hair is gently rinsed, followed by a color-sealing treatment and optional toner for enhanced vibrancy. We finish with a professional blow-dry and style to showcase your beautiful new color.',
        duration: '15-20 min',
      },
    ],
    faqs: [
      {
        question: 'How long does hair color last?',
        answer:
          'With proper care, professional hair color typically lasts 4-6 weeks before requiring a root touch-up. The vibrancy of the color gradually fades over 6-8 weeks. Using color-safe shampoo and conditioner can extend the life of your color significantly.',
      },
      {
        question: 'Will coloring damage my hair?',
        answer:
          'Our gentle, low-ammonia Japanese formulas are designed to minimize damage while delivering beautiful results. We also include conditioning treatments to protect and nourish your hair during the coloring process. However, any chemical process does affect hair structure, which is why we recommend regular deep conditioning treatments.',
      },
      {
        question: "Can I color my hair if it's already been treated?",
        answer:
          "Yes, but we need to assess your hair's condition first. If you've recently had other chemical treatments like perms or relaxers, we may recommend waiting or using alternative coloring methods. During your consultation, please inform us of any previous treatments.",
      },
      {
        question: 'How do I choose the right color?',
        answer:
          "Our experienced colorists will help you select the perfect shade based on your skin tone, eye color, lifestyle, and maintenance preferences. We'll show you color swatches and can perform a strand test if you're unsure. We recommend bringing inspiration photos to your consultation.",
      },
      {
        question: "What's the difference between root touch-up and full color?",
        answer:
          'A root touch-up colors only the new growth at your roots (typically 1-2 inches), perfect for maintaining your existing color. A full color service colors your entire head of hair, ideal for changing your color completely or refreshing faded color throughout.',
      },
    ],
    aftercare: [
      'Wait 48 hours after coloring before shampooing to allow the color to fully set',
      'Use sulfate-free, color-safe shampoo and conditioner to preserve vibrancy',
      'Wash hair with cool or lukewarm water instead of hot water to prevent color fading',
      'Apply a deep conditioning treatment or hair mask weekly to maintain moisture',
      'Minimize heat styling and always use heat protectant spray when blow-drying or styling',
      'Avoid chlorinated pools or wear a swim cap, as chlorine can alter hair color',
      'Schedule touch-ups every 4-6 weeks to maintain fresh color and root coverage',
    ],
  },

  balayage: {
    serviceName: 'Balayage',
    overview: {
      whatIsIt:
        'Balayage is a sophisticated hand-painting technique that creates natural-looking, sun-kissed highlights with seamless, gradual dimension. Unlike traditional foil highlights, balayage allows for a more customized, freehand application that mimics the way hair naturally lightens in the sun. The result is soft, flowing color that grows out beautifully without harsh lines.',
      whoIsItFor:
        'Ideal for those seeking a low-maintenance highlighting technique with a natural, lived-in look. Perfect if you want to add dimension and brightness without the commitment of regular touch-ups. Balayage works beautifully on all hair lengths and textures, and can be customized from subtle warmth to dramatic lightening.',
      keyFeature:
        'Hand-painted highlights create a natural gradient effect with no harsh regrowth lines, lasting 3-4 months between appointments.',
    },
    benefits: [
      {
        title: 'Natural Sun-Kissed Look',
        description:
          'Hand-painted highlights mimic natural sun-lightened hair with soft, blended dimension that looks effortlessly beautiful.',
      },
      {
        title: 'Low Maintenance',
        description:
          'Grows out gracefully without obvious regrowth lines, allowing 3-4 months between touch-ups instead of 6-8 weeks.',
      },
      {
        title: 'Customizable Placement',
        description:
          'Strategic placement around your face and through the mid-lengths creates dimension exactly where you want it.',
      },
      {
        title: 'Versatile for All Hair Types',
        description:
          'Works beautifully on straight, wavy, or curly hair, and can be adapted for brunettes, blondes, and redheads.',
      },
      {
        title: 'Adds Depth & Dimension',
        description:
          'Multi-tonal results create movement and texture, making hair appear fuller and more dynamic.',
      },
      {
        title: 'Gradual Lightening',
        description:
          'Perfect for those who want to go lighter without the commitment of full blonde highlights.',
      },
    ],
    processSteps: [
      {
        number: 1,
        title: 'Consultation & Planning',
        description:
          'We discuss your desired level of lightness, placement preferences, and maintenance expectations. Our colorist will analyze your hair tone, texture, and condition to create a custom balayage plan that enhances your features.',
        duration: '10-15 min',
      },
      {
        number: 2,
        title: 'Sectioning & Preparation',
        description:
          'Your hair is carefully sectioned based on the balayage design. We prepare the lightener formula customized to your hair type and desired lift level, ensuring optimal results while maintaining hair health.',
        duration: '5-10 min',
      },
      {
        number: 3,
        title: 'Hand-Painting Application',
        description:
          'Using expert freehand technique, we paint highlights onto select sections of your hair, focusing on areas where the sun would naturally lighten. The application is feathered and blended for a seamless, gradual effect.',
        duration: '45-60 min',
      },
      {
        number: 4,
        title: 'Processing & Lightening',
        description:
          'The lightener develops while we monitor the lift level closely. Processing time varies based on your natural hair color and desired result, ensuring we achieve the perfect tone without over-processing.',
        duration: '20-40 min',
      },
      {
        number: 5,
        title: 'Toning & Styling',
        description:
          'After rinsing, we apply a custom toner to neutralize any unwanted warmth and achieve your perfect shade. Your balayage is then styled with a blow-dry to showcase the beautiful dimension and movement.',
        duration: '30-40 min',
      },
    ],
    faqs: [
      {
        question: 'How is balayage different from regular highlights?',
        answer:
          'Balayage is a freehand painting technique that creates a more natural, graduated look, while traditional highlights use foils for a more uniform result. Balayage grows out much more gracefully without harsh demarcation lines, requiring less frequent touch-ups (every 3-4 months vs. 6-8 weeks for foil highlights).',
      },
      {
        question: 'How long does balayage take?',
        answer:
          'A full balayage session typically takes 2.5-3 hours, including consultation, application, processing, toning, and styling. The exact time depends on your hair length, thickness, and how much lightening is needed. Partial balayage may take slightly less time.',
      },
      {
        question: 'Will balayage damage my hair?',
        answer:
          "Balayage does involve bleaching, which can affect hair health. However, because it's applied strategically rather than all-over, and we use premium lighteners with bond-building treatments, damage is minimized. We recommend regular deep conditioning treatments and may suggest Olaplex or similar treatments for added protection.",
      },
      {
        question: 'Can I get balayage on dark hair?',
        answer:
          'Absolutely! Balayage is beautiful on dark hair, creating rich, multidimensional tones like caramel, honey, or bronze. On very dark hair, we may recommend a gradual lightening approach over multiple sessions to maintain hair health while achieving your desired brightness.',
      },
      {
        question: 'How do I maintain my balayage?',
        answer:
          'Use purple or blue shampoo weekly to maintain tone (purple for warm tones, blue for cool). Minimize heat styling, use heat protectant, and deep condition regularly. Touch-ups are typically needed every 3-4 months, though many clients stretch to 4-5 months due to the natural grow-out.',
      },
    ],
    aftercare: [
      'Wait 48-72 hours before washing to allow the toner to fully set',
      'Use purple shampoo once weekly to neutralize brassiness and maintain cool tones',
      'Apply a deep conditioning mask or treatment weekly to replenish moisture',
      'Minimize heat styling and always use a heat protectant spray',
      'Avoid chlorinated water or apply leave-in conditioner before swimming',
      'Use color-safe, sulfate-free shampoo and conditioner',
      'Schedule toning appointments every 8-12 weeks to refresh your blonde tones',
      'Book full balayage touch-ups every 3-4 months for optimal maintenance',
    ],
  },

  'hair-rebonding': {
    serviceName: 'Hair Rebonding',
    overview: {
      whatIsIt:
        'Hair rebonding is a permanent straightening treatment that transforms curly, wavy, or frizzy hair into sleek, pin-straight locks. This Japanese technique uses a two-step chemical process to break down and restructure hair bonds, creating smooth, straight hair that lasts for months. The result is glossy, manageable hair that requires minimal styling.',
      whoIsItFor:
        'Perfect for those with naturally curly, wavy, or unmanageable hair who desire permanently straight, smooth results. Ideal if you spend significant time blow-drying or flat-ironing daily and want a long-term solution. Best suited for those committed to the maintenance and touch-up schedule required to keep hair looking its best.',
      keyFeature:
        'Our premium Japanese formulas with Shiseido or Mucota treatments deliver ultra-smooth, healthy-looking straight hair that lasts 6-8 months.',
    },
    benefits: [
      {
        title: 'Permanently Straight Hair',
        description:
          'Chemically restructures hair bonds for straight, sleek results that last 6-8 months without daily styling.',
      },
      {
        title: 'Eliminates Frizz Completely',
        description:
          'Say goodbye to humidity-induced frizz and flyaways with permanently smooth, controlled hair.',
      },
      {
        title: 'Saves Daily Styling Time',
        description:
          'No more blow-drying or flat-ironing required. Wake up to naturally straight, manageable hair every day.',
      },
      {
        title: 'Glossy, Shiny Finish',
        description:
          'The straightening process creates a smooth cuticle that reflects light beautifully for high-gloss shine.',
      },
      {
        title: 'Customizable Straightness',
        description:
          'From natural-looking smoothness to ultra-straight results, we can adjust the technique to your preference.',
      },
      {
        title: 'Long-Lasting Results',
        description:
          'Unlike keratin treatments, rebonding creates permanent straightness that only requires root touch-ups as hair grows.',
      },
    ],
    processSteps: [
      {
        number: 1,
        title: 'Hair Analysis & Consultation',
        description:
          "We assess your hair's texture, previous treatments, and overall condition to determine the best rebonding formula and technique. We'll discuss your expectations and ensure you understand the maintenance requirements.",
        duration: '10-15 min',
      },
      {
        number: 2,
        title: 'Relaxer Application',
        description:
          'A carefully selected straightening cream is applied section by section to break down the natural bonds in your hair. The formula strength is customized based on your hair type and texture for optimal results.',
        duration: '30-45 min',
      },
      {
        number: 3,
        title: 'Processing & Monitoring',
        description:
          'The relaxer is left to process while we closely monitor the straightening progress. This critical step requires expert timing to achieve smooth results without over-processing.',
        duration: '20-30 min',
      },
      {
        number: 4,
        title: 'Rinse, Blow-Dry & Flat-Iron',
        description:
          'After thorough rinsing, your hair is precision blow-dried to 100% straight using a round brush technique. Then each section is carefully flat-ironed at controlled temperature to seal the new straight structure.',
        duration: '45-60 min',
      },
      {
        number: 5,
        title: 'Neutralizer Application',
        description:
          'A neutralizing solution is applied to rebuild and lock the hair bonds in their new straight formation. This critical step ensures long-lasting results and hair health.',
        duration: '20-30 min',
      },
      {
        number: 6,
        title: 'Final Styling & Treatment',
        description:
          'After a final rinse, we apply a nourishing treatment to restore moisture and seal the cuticle. Your hair is styled to showcase the sleek, straight finish.',
        duration: '15-20 min',
      },
    ],
    faqs: [
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
    aftercare: [
      'Do not wash, wet, or tie your hair for 3 full days after rebonding to allow the bonds to fully set',
      'Sleep on a silk or satin pillowcase and keep hair completely straight while sleeping',
      'Avoid tucking hair behind ears, using hair clips, or creating any bends in the first 72 hours',
      'Use only sulfate-free, chemical-treatment-safe shampoo and conditioner',
      'Apply a deep conditioning mask or treatment weekly to maintain moisture',
      'Minimize heat styling; when necessary, use low heat settings with protectant',
      'Avoid chlorinated pools and sea water, or rinse immediately after exposure',
      'Schedule root touch-up appointments every 6-8 months as new growth appears',
      'Consult your stylist before any chemical treatments (coloring, highlighting, perming)',
    ],
  },

  'hair-treatment': {
    serviceName: 'Scalp Treatment',
    overview: {
      whatIsIt:
        'Our therapeutic scalp treatment is a comprehensive care service designed to cleanse, balance, and nourish your scalp for optimal hair health. Using specialized products and techniques, we address concerns like excess oil, dryness, dandruff, itchiness, and promote healthy hair growth. The treatment includes deep cleansing, gentle exfoliation, stimulating massage, and nutrient-rich masks tailored to your scalp type.',
      whoIsItFor:
        'Perfect for anyone experiencing scalp concerns like oiliness, dryness, flaking, dandruff, itchiness, or hair loss. Also ideal for those who simply want to maintain a healthy scalp environment as the foundation for beautiful hair. Especially beneficial for those who style frequently, live in humid climates, or have stress-related scalp sensitivity.',
      keyFeature:
        'Our Advanced Scalp Therapy uses premium Parisian formulas to target specific concerns while promoting optimal scalp health and hair growth.',
    },
    benefits: [
      {
        title: 'Deep Scalp Cleansing',
        description:
          'Removes buildup, excess oils, and impurities that regular shampooing can miss, creating a clean foundation for healthy hair.',
      },
      {
        title: 'Balanced Oil Production',
        description:
          'Regulates sebum production to reduce oiliness or dryness, maintaining optimal scalp moisture balance.',
      },
      {
        title: 'Reduces Dandruff & Flaking',
        description:
          'Targeted formulas and exfoliation techniques effectively address flaking and dandruff at the source.',
      },
      {
        title: 'Stimulates Hair Growth',
        description:
          'Massage techniques and nutrient-rich treatments improve blood circulation to hair follicles, promoting healthier growth.',
      },
      {
        title: 'Soothes Irritation',
        description:
          'Calming ingredients and gentle techniques relieve itchiness, sensitivity, and inflammation.',
      },
      {
        title: 'Promotes Overall Hair Health',
        description:
          'A healthy scalp is the foundation for strong, shiny, vibrant hair that grows better and looks its best.',
      },
    ],
    processSteps: [
      {
        number: 1,
        title: 'Scalp Analysis',
        description:
          'We begin with a thorough examination of your scalp using magnification if needed to identify your specific concerns, scalp type, and any areas requiring special attention. This analysis determines the perfect treatment protocol for your needs.',
        duration: '10 min',
      },
      {
        number: 2,
        title: 'Deep Cleansing',
        description:
          'A specialized clarifying shampoo or pre-treatment solution is applied to remove buildup, excess oils, product residue, and impurities. We gently work the cleanser through your scalp to ensure thorough purification.',
        duration: '10 min',
      },
      {
        number: 3,
        title: 'Gentle Exfoliation',
        description:
          'A scalp scrub or exfoliating treatment is applied to slough away dead skin cells and further deep-clean pores. This step is crucial for addressing flaking and allowing better absorption of subsequent treatments.',
        duration: '10 min',
      },
      {
        number: 4,
        title: 'Therapeutic Massage',
        description:
          'Our signature scalp massage uses specific techniques to stimulate blood circulation, relieve tension, and promote relaxation. This not only feels incredible but also enhances nutrient delivery to hair follicles.',
        duration: '15 min',
      },
      {
        number: 5,
        title: 'Treatment Mask Application',
        description:
          'A customized treatment mask rich in nutrients, vitamins, and active ingredients is applied based on your scalp concerns. For advanced treatments, concentrated ampoules may be added for intensified results.',
        duration: '5 min',
      },
      {
        number: 6,
        title: 'Steam & Processing',
        description:
          'Gentle steam or heat is applied to help the treatment penetrate deeply into the scalp and hair follicles. This maximizes the effectiveness of the active ingredients.',
        duration: '10-15 min',
      },
      {
        number: 7,
        title: 'Rinse & Finish',
        description:
          'The treatment is thoroughly rinsed, and your hair is gently cleansed with a pH-balancing shampoo. We finish with a light conditioner on the lengths and a quick blow-dry if desired.',
        duration: '10 min',
      },
    ],
    faqs: [
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
          'Our regular Scalp Treatment provides deep cleansing and general scalp health maintenance using quality formulas. The Advanced Scalp Therapy uses premium Parisian formulas specifically targeting concerns like hair loss, severe dandruff, or extreme oiliness, and includes optional treatment ampoule boosts for intensified results.',
      },
    ],
    aftercare: [
      'Avoid washing your hair for at least 24 hours after treatment to allow products to fully absorb',
      'Use a gentle, sulfate-free shampoo formulated for your scalp type',
      'Limit the use of heavy styling products that can cause buildup between treatments',
      'Gently massage your scalp for 2-3 minutes during shampooing to stimulate circulation',
      'Avoid very hot water when washing hair, as it can trigger excess oil production',
      'Protect your scalp from sun exposure with hats or UV-protective hair products',
      'Maintain a balanced diet rich in vitamins and minerals for overall scalp and hair health',
      'Schedule regular scalp treatments every 4-6 weeks for optimal results',
    ],
  },

  'hair-perm': {
    serviceName: 'Hair Perm',
    overview: {
      whatIsIt:
        'A hair perm (permanent wave) is a chemical treatment that transforms straight hair into beautiful curls, waves, or added volume that lasts for months. Using advanced Korean and Japanese formulas, we restructure hair bonds to create your desired curl pattern—from loose, beachy waves to tight, bouncy curls. Digital perms use heat styling for soft, natural-looking waves, while classic perms create more defined curls.',
      whoIsItFor:
        'Ideal for those with straight, flat hair who want lasting curls or waves without daily heat styling. Perfect if you dream of effortless, textured hair that requires minimal styling, or if you want to add volume and body to fine, limp hair. Great for creating low-maintenance, lived-in looks that work with your natural hair texture.',
      keyFeature:
        'Our Digital Perm technique creates natural, heat-styled waves that last 6-8 months with minimal daily maintenance.',
    },
    benefits: [
      {
        title: 'Long-Lasting Curls & Waves',
        description:
          'Enjoy beautiful curls or waves for 6-8 months without the daily commitment of heat styling tools.',
      },
      {
        title: 'Natural-Looking Volume',
        description:
          'Add fullness and body to fine or flat hair with permed texture that looks effortlessly natural.',
      },
      {
        title: 'Low Maintenance Styling',
        description:
          'Wake up with textured, styled-looking hair. Simply scrunch with product and air-dry or diffuse for gorgeous results.',
      },
      {
        title: 'Versatile Curl Patterns',
        description:
          'From loose beachy waves to tight spiral curls, we can create the exact curl size and pattern you desire.',
      },
      {
        title: 'Reduces Daily Heat Damage',
        description:
          'Eliminate the need for daily curling irons or wands, reducing long-term heat damage to your hair.',
      },
      {
        title: 'Works for All Hair Lengths',
        description:
          'Perms can be customized for short, medium, or long hair, with techniques adjusted for your length and desired style.',
      },
    ],
    processSteps: [
      {
        number: 1,
        title: 'Consultation & Curl Selection',
        description:
          'We discuss your desired curl size, pattern, and styling preferences. Using different rod sizes as visual guides, we help you select the perfect curl that suits your hair length, face shape, and lifestyle.',
        duration: '15 min',
      },
      {
        number: 2,
        title: 'Hair Preparation',
        description:
          'Your hair is shampooed to remove any product buildup and prepare the cuticle for optimal perm solution absorption. We may also trim ends if needed for the best curl formation.',
        duration: '10 min',
      },
      {
        number: 3,
        title: 'Rod Wrapping',
        description:
          'Your hair is carefully sectioned and wrapped around perm rods in a specific pattern to create your desired curl. For digital perms, special heat rods are used. This step requires precision and expertise.',
        duration: '45-60 min',
      },
      {
        number: 4,
        title: 'Perm Solution Application',
        description:
          'A customized perm solution is applied to break down the hair bonds and allow them to reform in the new curl pattern. The formula strength is selected based on your hair type and texture.',
        duration: '10-15 min',
      },
      {
        number: 5,
        title: 'Processing',
        description:
          'The solution is left to process while we monitor the curl development. For digital perms, controlled heat is applied to the rods. Processing time varies based on hair type and desired curl intensity.',
        duration: '20-40 min',
      },
      {
        number: 6,
        title: 'Neutralization',
        description:
          'After thoroughly rinsing, a neutralizer is applied to rebuild and lock the hair bonds in their new curled formation. This critical step ensures lasting, springy curls.',
        duration: '10-15 min',
      },
      {
        number: 7,
        title: 'Styling & Finishing',
        description:
          'Rods are carefully removed and your new curls are styled with appropriate products. We teach you how to style and maintain your perm at home for best results.',
        duration: '15-20 min',
      },
    ],
    faqs: [
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
    aftercare: [
      'Do not wash, wet, or tie up your hair for 48 hours after perming to allow curls to fully set',
      'Avoid heat styling tools (flat irons, curling irons) which can damage and loosen permed curls',
      'Use sulfate-free, curl-friendly shampoo and conditioner formulated for permed hair',
      'Apply a deep conditioning treatment or hair mask weekly to maintain moisture and curl definition',
      'Detangle gently with fingers or a wide-tooth comb when hair is wet and conditioned—never brush dry permed hair',
      'Scrunch curl-enhancing products into damp hair and air-dry or diffuse on low heat',
      'Sleep on a silk or satin pillowcase to reduce frizz and maintain curl pattern',
      'Trim ends regularly every 6-8 weeks to prevent split ends and keep curls bouncy',
      'Avoid chlorinated pools or protect hair with a swim cap and rinse immediately after',
    ],
  },
};

// Helper function to get service content by service name or slug
export function getServiceContent(nameOrSlug: string): ServiceContent | null {
  // Try direct match first
  if (serviceContentMap[nameOrSlug]) {
    return serviceContentMap[nameOrSlug];
  }

  // Try to match by service name (case-insensitive, converted to slug format)
  const slug = nameOrSlug.toLowerCase().replace(/\s+/g, '-');
  return serviceContentMap[slug] || null;
}
