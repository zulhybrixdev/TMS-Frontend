import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Tabs } from "../components/ui/Tabs";
import { BeneficiariesTab } from "../components/beneficiaries/BeneficiariesTab";
import { PaymentTemplatesTab } from "../components/beneficiaries/PaymentTemplatesTab";
import { t, tk } from "../i18n";

const TABS = [
  { key: "beneficiaries", label: tk("Beneficiaries") },
  { key: "templates", label: tk("Payment Templates") },
];

export default function BeneficiariesPage() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [tab, setTab] = useState(TABS.some((t) => t.key === initialTab) ? initialTab! : "beneficiaries");

  return (
    <>
      <PageHeader title={t("Beneficiaries & Templates")} description={t("Saved payees and reusable payment templates - prefill payments instead of retyping them every time.")} />
      <Card>
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
        {tab === "beneficiaries" ? <BeneficiariesTab /> : <PaymentTemplatesTab />}
      </Card>
    </>
  );
}
