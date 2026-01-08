import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface FAQItem {
  question: string;
  answer: string;
}

interface ServiceFAQProps {
  title: string;
  description?: string;
  questions: FAQItem[];
}

export function ServiceFAQ({ title, description, questions }: ServiceFAQProps) {
  return (
    <section className="py-20 px-6 bg-stone-50">
      <div className="max-w-4xl mx-auto">
        <div className="md:text-center mb-12">
          <h2 className="text-3xl font-serif font-light mb-8">{title}</h2>
          {description && <p className="text-xl text-stone-600">{description}</p>}
        </div>
        <Accordion type="single" collapsible className="space-y-4">
          {questions.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="bg-white rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-md">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-stone-600 text-base">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
