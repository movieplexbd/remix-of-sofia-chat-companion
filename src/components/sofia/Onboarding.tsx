import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';

interface OnboardingProps {
  onComplete: (data: { name: string; age: string; gender: string }) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('female');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && age.trim()) {
      onComplete({ name, age, gender });
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md shadow-2xl border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            আপনার সাথে পরিচিত হতে চাই
          </CardTitle>
          <CardDescription>
            সোফিয়া আপনার সম্পর্কে জানতে চায় যাতে সে আপনাকে আরও ভালোভাবে সাহায্য করতে পারে।
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">আপনার নাম</Label>
              <Input
                id="name"
                placeholder="যেমন: আরিয়ান"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">আপনার বয়স</Label>
              <Input
                id="age"
                type="number"
                placeholder="যেমন: ২৫"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
                className="focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-3">
              <Label>আপনার লিঙ্গ</Label>
              <RadioGroup value={gender} onValueChange={setGender} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male" className="cursor-pointer">পুরুষ</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female" className="cursor-pointer">নারী</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other" className="cursor-pointer">অন্যান্য</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full font-bold py-6 text-lg shadow-lg hover:scale-[1.02] transition-transform">
              শুরু করি 🚀
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
