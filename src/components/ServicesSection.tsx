'use client';

import { Section, Container, Heading, Text, Tabs, Box, Card, Flex, Badge } from '@radix-ui/themes';
import { SALON_SERVICE_CATEGORIES } from '../constants';

export default function ServicesSection() {
  return (
    <Section size="3" className="bg-[#FDFCF8]" id="services-section">
      <Container size="3">
        <div className="text-center mb-12">
          <Text size="2" className="uppercase tracking-[0.2em] text-gold-600 font-sans mb-4 block">
            Our Menu
          </Text>
          <Heading size="8" className="font-light mb-6">
            Services & Pricing
          </Heading>
          <p className="text-stone-600 leading-relaxed font-sans max-w-2xl mx-auto">
            Discover our range of premium hair services designed to enhance your natural beauty.
          </p>
        </div>

        <Tabs.Root defaultValue={SALON_SERVICE_CATEGORIES[0].id}>
          <Tabs.List className="flex justify-center mb-10 border-b border-stone-200">
            {SALON_SERVICE_CATEGORIES.map(category => (
              <Tabs.Trigger
                key={category.id}
                value={category.id}
                className="px-6 py-3 text-lg font-light data-[state=active]:text-stone-900 data-[state=active]:border-b-2 data-[state=active]:border-stone-900 text-stone-500 hover:text-stone-700 transition-colors cursor-pointer"
              >
                {category.title}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <Box pt="3">
            {SALON_SERVICE_CATEGORIES.map(category => (
              <Tabs.Content key={category.id} value={category.id}>
                <div className="grid gap-4 max-w-3xl mx-auto">
                  {category.items.map((item, index) => (
                    <Card
                      key={index}
                      className="p-6 hover:shadow-md transition-shadow bg-white border border-stone-100"
                    >
                      <Flex
                        justify="between"
                        align="start"
                        gap="4"
                        direction={{ initial: 'column', sm: 'row' }}
                      >
                        <Box className="flex-1">
                          <Heading size="4" className="font-normal mb-1 text-stone-800">
                            {item.name}
                          </Heading>
                          {item.description && (
                            <Text as="p" size="2" className="text-stone-500 font-sans mt-1">
                              {item.description}
                            </Text>
                          )}
                          {item.addons && (
                            <div className="mt-3 space-y-1">
                              {item.addons.map((addon, idx) => (
                                <Flex key={idx} gap="2" align="center">
                                  <Badge
                                    color="gray"
                                    variant="soft"
                                    radius="full"
                                    className="font-sans text-xs px-2"
                                  >
                                    Add-on
                                  </Badge>
                                  <Text size="2" className="text-stone-600 font-sans">
                                    {addon.name} <span className="text-stone-400 mx-1">•</span>{' '}
                                    {addon.price}
                                  </Text>
                                </Flex>
                              ))}
                            </div>
                          )}
                        </Box>
                        <Text size="5" className="font-light text-stone-900 whitespace-nowrap">
                          {item.price}
                        </Text>
                      </Flex>
                    </Card>
                  ))}
                </div>
              </Tabs.Content>
            ))}
          </Box>
        </Tabs.Root>
      </Container>
    </Section>
  );
}
