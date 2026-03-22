import { PaymentMethod, PaymentStatus } from "@prisma/client";
import { config } from "../config/config";
import { logger } from "../utils/logger";
import { withCircuitBreaker, withRetry, withTimeout } from "./resilienceService";

export type PaymentResult = { paymentStatus: PaymentStatus; paymentRef: string };

/**
 * External-like payment processing: COD is accepted immediately (cash on delivery obligation).
 * MOCK simulates a card gateway with timeout + retries + circuit breaker (no random failures).
 */
export const paymentService = {
  async processPayment(input: {
    amount: number;
    paymentMethod: PaymentMethod;
    requestId?: string;
  }): Promise<PaymentResult> {
    if (!config.features.enablePayments) {
      return { paymentStatus: "SUCCESS", paymentRef: "PAY_DISABLED" };
    }

    if (input.paymentMethod === "COD") {
      const ref = `PAY_COD_${Date.now()}`;
      logger.info(
        "payment.cod.accepted",
        { amount: input.amount, paymentRef: ref },
        input.requestId
      );
      return { paymentStatus: "SUCCESS", paymentRef: ref };
    }

    /** MOCK, CARD, UPI, WALLET — simulated external gateway */
    const executeMockGateway = async (): Promise<PaymentResult> => {
      await new Promise((resolve) => setTimeout(resolve, config.payment.mockLatencyMs));
      return {
        paymentStatus: "SUCCESS" as PaymentStatus,
        paymentRef: `PAY_MOCK_${Date.now()}`,
      };
    };

    try {
      const result = await withCircuitBreaker(
        "payment-mock-gateway",
        () =>
          withRetry(
            () => withTimeout(executeMockGateway(), config.resilience.requestTimeoutMs),
            config.resilience.retryCount
          ),
        config.resilience.circuitBreakerFailureThreshold,
        config.resilience.circuitBreakerResetMs
      );

      logger.info(
        "payment.processed",
        {
          amount: input.amount,
          method: input.paymentMethod,
          paymentRef: result.paymentRef,
        },
        input.requestId
      );
      return result;
    } catch (error) {
      logger.warn(
        "payment.failed",
        { amount: input.amount, method: input.paymentMethod, error: String(error) },
        input.requestId
      );
      return {
        paymentStatus: "FAILED",
        paymentRef: `PAY_FAIL_${Date.now()}`,
      };
    }
  },
};
