
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


export default function LoginCard() {
  return (
    <div className="bg-gray-50 w-full min-h-screen py-25">
      <Card className="mx-auto max-w-md bg-white shadow-sm border-none rounded-xl px-6 pt-10 pb-10 flex flex-col gap-10">
      <CardHeader className="flex flex-col items-center justify-center gap-4">
        <CardTitle className="text-4xl font-bold ">Login</CardTitle>
        
        
      </CardHeader>
      <CardContent>
        <form>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-8">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-[0.9rem]  ">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  className="rounded-sm h-12.5 px-5"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password" className="text-[0.9rem]">Password</Label>
                  
                </div>
                <Input id="password" type="password" placeholder="Confirm Password" className="rounded-sm  h-12.5 px-5" required />
                <a
                    href="#"
                    className="mr-auto inline-block text-[0.9rem] underline-offset-4 "
                  >
                    Forgot your password?
                  </a>
              </div>

              <Button type="submit" className="w-full h-12.5 rounded-sm bg-black text-base text-white hover:bg-[#3CB371] transition bg-[#00674b] cursor-pointer">
                Login
              </Button>
            </div>

            <div className="text-sm flex justify-center text-gray-600">
              Don't have an account? <a href="/signup" className="font-medium text-black"> Sign Up for Free</a>
            </div>
          </div>
        </form>
      </CardContent>

       <div className="flex items-center gap-3 my-2">
         <span className="flex-1 h-px bg-gray-200" />
         <span className="text-sm text-gray-500 px-3">Or sign up with Google</span>
         <span className="flex-1 h-px bg-gray-200" />
       </div>

      <CardFooter className="flex-col gap-2">
        
        <Button variant="outline" className="w-full flex items-center justify-center gap-3  h-12.5 rounded-sm border-gray-300 hover:bg-gray-100 transition hover:bg-white cursor-pointer">
            <img src="/google.png" alt="Google Logo" className="w-5 h-5 object-cover bg-gray-200" />
          <span className="text-sm">Sign up with Google</span>
        </Button>
      </CardFooter>
      </Card>
    </div>
  )
}

