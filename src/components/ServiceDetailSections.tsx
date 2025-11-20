'use client';

import React from 'react';
import { Heading, Text, Container } from '@radix-ui/themes';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Check, Sparkles, Clock } from '@/lib/icons';

// Service-specific content interfaces
export interface ProcessStep {
  number: number;
  title: string;
  description: string;
  duration?: string;
}

export interface Benefit {
  title: string;
  description: string;
  icon?: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface ServiceContent {
  serviceName: string;
  overview: {
    whatIsIt: string;
    whoIsItFor: string;
    keyFeature?: string;
  };
  benefits: Benefit[];
  processSteps: ProcessStep[];
  faqs: FAQ[];
  aftercare: string[];
}

interface ServiceDetailSectionsProps {
  content: ServiceContent;
}

export default function ServiceDetailSections({ content }: ServiceDetailSectionsProps) {
  return (
    <div className="space-y-20">
      {/* Overview Section */}
      <section>
        <Container size="3" className="px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <Heading size="6" className="font-serif mb-4 text-stone-900">
                What is {content.serviceName}?
              </Heading>
              <Text className="text-stone-600 leading-relaxed text-base">
                {content.overview.whatIsIt}
              </Text>
            </div>
            <div>
              <Heading size="6" className="font-serif mb-4 text-stone-900">
                Who is this for?
              </Heading>
              <Text className="text-stone-600 leading-relaxed text-base">
                {content.overview.whoIsItFor}
              </Text>
              {content.overview.keyFeature && (
                <div className="mt-6 p-4 bg-gold-50 border-l-4 border-gold-400 rounded-r-lg">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-gold-600 mt-0.5 shrink-0" />
                    <Text className="text-stone-700 text-sm font-medium">
                      {content.overview.keyFeature}
                    </Text>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* Benefits Section */}
      <section className="bg-gradient-to-b from-white to-stone-50 -mx-6 px-6 py-16 md:-mx-12 md:px-12">
        <Container size="3" className="px-0">
          <div className="text-center mb-12">
            <Text className="uppercase tracking-[0.2em] text-xs font-sans text-stone-500 mb-3 block">
              Why Choose This Service
            </Text>
            <Heading size="8" className="font-serif font-light text-stone-900">
              The Benefits
            </Heading>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {content.benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-full bg-gold-100 flex items-center justify-center mb-4">
                  <Check className="w-6 h-6 text-gold-600" />
                </div>
                <Heading size="4" className="font-serif mb-3 text-stone-900">
                  {benefit.title}
                </Heading>
                <Text className="text-stone-600 text-sm leading-relaxed">
                  {benefit.description}
                </Text>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Process Steps Section */}
      <section>
        <Container size="3" className="px-0">
          <div className="text-center mb-12">
            <Text className="uppercase tracking-[0.2em] text-xs font-sans text-stone-500 mb-3 block">
              What To Expect
            </Text>
            <Heading size="8" className="font-serif font-light text-stone-900">
              The Process
            </Heading>
          </div>
          <div className="space-y-6">
            {content.processSteps.map((step, index) => (
              <div
                key={index}
                className="flex gap-6 items-start p-6 bg-white rounded-xl border border-stone-100 hover:border-gold-300 transition-colors"
              >
                <div className="shrink-0">
                  <div className="w-14 h-14 rounded-full bg-stone-900 text-white flex items-center justify-center text-xl font-bold">
                    {step.number}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <Heading size="5" className="font-serif text-stone-900">
                      {step.title}
                    </Heading>
                    {step.duration && (
                      <div className="flex items-center gap-1.5 text-stone-500 text-sm shrink-0">
                        <Clock className="w-4 h-4" />
                        <span>{step.duration}</span>
                      </div>
                    )}
                  </div>
                  <Text className="text-stone-600 leading-relaxed">{step.description}</Text>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQ Section */}
      <section className="bg-stone-50 -mx-6 px-6 py-16 md:-mx-12 md:px-12">
        <Container size="3" className="px-0">
          <div className="text-center mb-12">
            <Text className="uppercase tracking-[0.2em] text-xs font-sans text-stone-500 mb-3 block">
              Common Questions
            </Text>
            <Heading size="8" className="font-serif font-light text-stone-900">
              Frequently Asked Questions
            </Heading>
          </div>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {content.faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`faq-${index}`}
                  className="bg-white rounded-lg border border-stone-200 px-6 overflow-hidden"
                >
                  <AccordionTrigger className="text-left font-medium text-stone-900 hover:text-stone-700 py-5 hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-stone-600 leading-relaxed pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Container>
      </section>

      {/* Aftercare Section */}
      <section>
        <Container size="3" className="px-0">
          <div className="text-center mb-12">
            <Text className="uppercase tracking-[0.2em] text-xs font-sans text-stone-500 mb-3 block">
              Maintaining Your Results
            </Text>
            <Heading size="8" className="font-serif font-light text-stone-900">
              Aftercare Tips
            </Heading>
          </div>
          <div className="bg-white p-8 rounded-xl border border-stone-100 shadow-sm">
            <ul className="space-y-4">
              {content.aftercare.map((tip, index) => (
                <li key={index} className="flex gap-4 items-start">
                  <div className="shrink-0 w-6 h-6 rounded-full bg-gold-100 flex items-center justify-center mt-0.5">
                    <Check className="w-4 h-4 text-gold-600" />
                  </div>
                  <Text className="text-stone-700 leading-relaxed flex-1">{tip}</Text>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>
    </div>
  );
}
