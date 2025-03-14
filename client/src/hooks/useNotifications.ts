import { useQuery } from "@tanstack/react-query";
import { Message, QuoteRequest, Testimonial } from "@shared/schema";
import { useEffect, useState } from "react";

// Type for notification counts
export interface NotificationCounts {
  unreadMessages: number;
  pendingTestimonials: number;
  pendingQuoteRequests: number;
  total: number;
}

export const useNotifications = () => {
  const [counts, setCounts] = useState<NotificationCounts>({
    unreadMessages: 0,
    pendingTestimonials: 0,
    pendingQuoteRequests: 0,
    total: 0
  });

  // Get all messages
  const { 
    data: messages = [],
    isLoading: isLoadingMessages,
  } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    retry: 1,
  });

  // Get pending testimonials
  const { 
    data: pendingTestimonials = [],
    isLoading: isLoadingPendingTestimonials,
  } = useQuery<Testimonial[]>({
    queryKey: ["/api/admin/testimonials/pending"],
    retry: 1,
  });

  // Get all quote requests
  const { 
    data: quoteRequests = [],
    isLoading: isLoadingQuoteRequests,
  } = useQuery<QuoteRequest[]>({
    queryKey: ["/api/admin/quote/requests"],
    retry: 1,
  });

  // Calculate counts whenever data changes
  useEffect(() => {
    if (isLoadingMessages || isLoadingPendingTestimonials || isLoadingQuoteRequests) {
      return;
    }

    const unreadMessages = messages.filter(msg => !msg.read).length;
    const pendingTestimonialsCount = pendingTestimonials.length;
    const pendingQuoteRequestsCount = quoteRequests.filter(quote => 
      quote.status === "pending" && !quote.reviewed
    ).length;
    
    const totalCount = unreadMessages + pendingTestimonialsCount + pendingQuoteRequestsCount;
    
    setCounts({
      unreadMessages,
      pendingTestimonials: pendingTestimonialsCount,
      pendingQuoteRequests: pendingQuoteRequestsCount,
      total: totalCount
    });
  }, [messages, pendingTestimonials, quoteRequests, isLoadingMessages, isLoadingPendingTestimonials, isLoadingQuoteRequests]);

  return {
    counts,
    isLoading: isLoadingMessages || isLoadingPendingTestimonials || isLoadingQuoteRequests
  };
};