
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, ChevronRight } from "lucide-react";

const familySteps = [
  "Create family workspace",
  "Add family name and city",
  "Create your first event",
  "Add event dates",
  "Add wedding functions",
  "Open family dashboard",
];

const vendorSteps = [
  "Select vendor category",
  "Add business details",
  "Add service location",
  "Add portfolio images",
  "Add services and pricing",
  "Submit verification request",
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [isVendor, setIsVendor] = useState(false);
  const navigate = useNavigate();
  const steps = isVendor ? vendorSteps : familySteps;

  const finish = () => {
    navigate(isVendor ? "/vendor/dashboard" : "/family/dashboard");
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-xl font-serif font-bold">{isVendor ? "Vendor Onboarding" : "Family Onboarding"}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setIsVendor(!isVendor)}>
              {isVendor ? "Planning an event?" : "Registering as a vendor?"}
            </Button>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="font-medium">{step + 1}</span> <ChevronRight className="h-3 w-3" /> <span>{steps.length}</span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-64 flex flex-col items-center justify-center text-center text-muted-foreground">
            <ArrowRight className="h-12 w-12 opacity-30 mb-3" />
            <p className="font-medium text-foreground">{steps[step]}</p>
            <p className="text-sm">Step {step + 1} of {steps.length}</p>
          </div>
          <div className="flex justify-between pt-6">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>
            )}
            <Button onClick={() => (step === steps.length - 1 ? finish() : setStep(step + 1))}>
              {step === steps.length - 1 ? "Finish Setup" : "Next <span>?</span>"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

