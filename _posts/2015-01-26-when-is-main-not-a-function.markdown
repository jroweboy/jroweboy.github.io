---
layout: post
title:  "Main is usually a function. So then when is it not?"
date:   2015-01-26 16:22:00
categories: c asm
comments: true
---
It began when my coworker, despite already knowing how to program, was forced to take the intro level Computer Science course at my university. We joked with him about how he needs to make a program that works, but the grading TAs wouldn't be able to figure out *how* it works. So that is the requirement, to make a functioning program that completes an assignment while obfuscating it such that the graders think that it shouldn't work. With this in mind, I started to think through the arsenal of tricks in C that I've seen used before and one thing in particular stood out. The idea for this trick I will explain how to accomplish came from a blog with the name [main is usually a function](http://mainisusuallyafunction.blogspot.com/) which got me thinking about when would main *not* be a function? Let's find out then!

(If you want to download any of the files, [you can download a zip of all the files I wrote here](/downloads/2015-01-26-when-is-main-not-a-function/sources.zip) Remember that I wrote them on 64-bit Linux and you'll need to adjust them to work on other platforms I'm guessing)

My problem solving process is typically the same thing I imagine most programmers do. Step 1: Google search about the problem. Step 2: Click every link on the first page that seems relevant. If not solved, try a different query and repeat. Thankfully, the answer to this question came on the very first search on [this Stackoverflow answer](http://stackoverflow.com/a/2252429/745719). Apparently in 1984, a strange program won the IOCCC where main was declared as a `short main[] = {...}` and somehow this did stuff and printed to the screen! Too bad it was written for a whole different architecture and compiler so there is really no easy way for me to find out what it did, but judging from the fact that it is just a bunch of numbers, I can surmise that the numbers there are just the compiled binary of some short function and the linker when looking for the main function just throws this in the place of it.

With our hypothesis in place, that the code for the program is just the compiled assembly of main function represented as an array, let's see if we can replicate this by making a small program and seeing if we can do that.

{% highlight c %}
char main[] = "Hello world!";
{% endhighlight %}

{% highlight bash %}
$ gcc -Wall main_char.c -o first
main_char.c:1:6: warning: ‘main’ is usually a function [-Wmain]
 char main[] = "Hello world!";
      ^
$ ./first
Segmentation fault
{% endhighlight %}

Alright! It worked! Kinda… So our next goal is we want it to actually print something to the screen. Thinking back to my limited ASM experience, I recalled that there are different sections of the compiled which determine where different things go. The two sections that are most relevant to us are the `.text` section and the `.data` section. `.text` contains all the executable code and it it readonly whereas `.data` contains readable and writable code, but it's not executable. In our case, we can only fill in code for the main function, so anything that gets placed in the data section is a no go. We need to find a way to get the string `"Hello world!"` inside the main function and reference it.

I began by looking into how to print something with as little code as possible. Since I knew the target system is going to be 64-bit Linux, I found that I can call the system write call and it would write out to the screen. Looking back at this now that I'm writing the code, I don't think that I needed to use Assembly for this, but at the same time, I'm really glad I got to learn what I did. Getting started writing inline GCC ASM was the hardest part, but once I got the hang of it, it started to become easier.

Getting started wasn't easy though. It turns out that most of the ASM knowledge I could find through Google is all of the following: really old, Intel syntax, and for 32-bit systems. Remember in our scenario, we need the file to compile with a gcc on a 64-bit system, without any special modifications to the compiler flags, so that means there is no special compile flags, nor can we include any custom linking steps and we want to use GCC inline AT&T syntax. Most of my time was spent trying to find information about modern assembly for 64-bit systems! Maybe my Google-fu is lacking :) This part was almost all trial and error. My goal was just use the write syscall to print "Hello world!" to the screen using gcc inline ASM, so why was it so hard? For the people that want to learn how to do this, I recommend the following sites: [Linux syscall list](https://filippo.io/linux-syscall-table/), [Intro to Inline ASM](http://wiki.osdev.org/Inline_Assembly), and [Differences between Intel and AT&T Syntax](http://asm.sourceforge.net/articles/linasm.html#Syntax)

Eventually my ASM code started to form and I had some code that seemed to work! Remember, my goal is to produce a main that is an array of the ASM that prints Hello World.

{% highlight c %}
void main() {
    __asm__ (
        // print Hello World
        "movl $1, %eax;\n"  /* 1 is the syscall number for write on 64-bit */
        "movl $1, %ebx;\n"  /* 1 is stdout and is the first argument */
        "movl $message, %esi;\n" /* load the address of string into the second argument*/
        "movl $13, %edx;\n"  /* third argument is the length of the string to print*/
        "syscall;\n"
        // call exit (so it doesn't try to run the string Hello World)
        // maybe I could have just used ret instead?
        "movl $60,%eax;\n"
        "xorl %ebx,%ebx; \n"
        "syscall;\n"
        // Store the Hello World inside the main function
        "message: .ascii \"Hello World!\\n\";"
    );
}
{% endhighlight %}

{% highlight bash %}
$ gcc -Wall asm_main.c -o second
asm_main.c:1:6: warning: return type of ‘main’ is not ‘int’ [-Wmain]
 void main() {
      ^
$ ./second
Hello World!
{% endhighlight %}

Hurray! It prints! Let's take a look at the compiled code in hex now, and it should match up one-to-one with the ASM code we wrote. I went ahead and broke down what's going on in the comments to the side.

{% highlight bash %}
(gdb) disass main
Dump of assembler code for function main:
   0x00000000004004ed <+0>:     push   %rbp             ; Compiler inserted
   0x00000000004004ee <+1>:     mov    %rsp,%rbp
   0x00000000004004f1 <+4>:     mov    $0x1,%eax        ; It's our code!
   0x00000000004004f6 <+9>:     mov    $0x1,%ebx
   0x00000000004004fb <+14>:    mov    $0x400510,%esi
   0x0000000000400500 <+19>:    mov    $0xd,%edx
   0x0000000000400505 <+24>:    syscall
   0x0000000000400507 <+26>:    mov    $0x3c,%eax
   0x000000000040050c <+31>:    xor    %ebx,%ebx
   0x000000000040050e <+33>:    syscall
   0x0000000000400510 <+35>:    rex.W                   ; String hello world
   0x0000000000400511 <+36>:    gs                      ; it's garbled since
   0x0000000000400512 <+37>:    insb   (%dx),%es:(%rdi) ; it's not real ASM
   0x0000000000400513 <+38>:    insb   (%dx),%es:(%rdi) ; so it couldn't be
   0x0000000000400514 <+39>:    outsl  %ds:(%rsi),(%dx) ; disassembled
   0x0000000000400515 <+40>:    and    %dl,0x6f(%rdi)
   0x0000000000400518 <+43>:    jb     0x400586
   0x000000000040051a <+45>:    and    %ecx,%fs:(%rdx)
   0x000000000040051d <+48>:    pop    %rbp             ; Compiler-inserted
   0x000000000040051e <+49>:    retq
End of assembler dump.
{% endhighlight %}

That looks like a functioning main to me! Now let's go and grab the hex contents of it, and dump it in as a string and see if that works. We can get the hex from main by using gdb again. I'm willing to guess that there must be a better way, so maybe someone can post a comment on this and let me know :) The way I did it was to load gdb and print the hex at main like so. Last time we disassembled main, we saw that it was 49 bytes long, so can use the `dump` command to save the hex to a file:

{% highlight bash %}
# example of how to print the hex
(gdb) x/49xb main
0x4004ed <main>:    0x55    0x48    0x89    0xe5    0xb8    0x01    0x00    0x00
0x4004f5 <main+8>:  0x00    0xbb    0x01    0x00    0x00    0x00    0xbe    0x10
0x4004fd <main+16>: 0x05    0x40    0x00    0xba    0x0d    0x00    0x00    0x00
0x400505 <main+24>: 0x0f    0x05    0xb8    0x3c    0x00    0x00    0x00    0x31
0x40050d <main+32>: 0xdb    0x0f    0x05    0x48    0x65    0x6c    0x6c    0x6f
0x400515 <main+40>: 0x20    0x57    0x6f    0x72    0x6c    0x64    0x21    0x0a
0x40051d <main+48>: 0x5d
# example of how to save it to a file
(gdb) dump memory hex.out main main+49
{% endhighlight %}

Now we have the hex dump, we can convert them all to integers the easiest way that I know of, and that is using python. In python 2.6 and 2.7 you can just use the following to convert it to a convenient array of ints for us to use.

{% highlight python %}
>>> import array
>>> hex_string = "554889E5B801000000BB01000000BE10054000BA0D0000000F05B83C00000031DB0F0548656C6C6F20576F726C64210A5D".decode("hex")
>>> array.array('B', hex_string)
array('B', [85, 72, 137, 229, 184, 1, 0, 0, 0, 187, 1, 0, 0, 0, 190, 16, 5, 64, 0, 186, 13, 0, 0, 0, 15, 5, 184, 60, 0, 0, 0, 49, 219, 15, 5, 72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33, 10, 93])
{% endhighlight %}

I figure if my bash foo and unix knowledge was greater I could find an easier way to do this, but googling things like "hex dump of compiled function" returns several questions about how to print hex in various languages. Regardless, we now have a comma seperated array of our function, so let's put that in a new file and see if it works! I went ahead and commented what each of the different values mean.

{% highlight c %}
char main[] = {
    85,                 // push   %rbp
    72, 137, 229,       // mov    %rsp,%rbp
    184, 1, 0, 0, 0,    // mov    $0x1,%eax
    187, 1, 0, 0, 0,    // mov    $0x1,%ebx
    190, 16, 5, 64, 0,  // mov    $0x400510,%esi
    186, 13, 0, 0, 0,   // mov    $0xd,%edx
    15, 5,              // syscall
    184, 60, 0, 0, 0,   // mov    $0x3c,%eax
    49, 219,            // xor    %ebx,%ebx
    15, 5,              // syscall
    // Hello world!\n
    72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100,
    33, 10,             // pop    %rbp
    93                  // retq
};
{% endhighlight %}

{% highlight bash %}
$ gcc -Wall compiled_array_main.c -o third
compiled_array_main.c:1:6: warning: ‘main’ is usually a function [-Wmain]
 char main[] = {
      ^
$ ./third
Segmentation fault
{% endhighlight %}

Segfault! What am I doing wrong? Time to fire up gdb again and try to see what the error is. Since main is no longer a function, we can't simply just use `break main` to set a break point there. Instead, we can use `break _start` to get a breakpoint at the method that calls the libc runtime startup (which in turn calls main) and we can see what address we pass to `__libc_start_main`:

{% highlight bash %}
$ gdb ./third
(gdb) break _start
(gdb) run
(gdb) layout asm
   ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
B+>│0x400400 <_start>                       xor    %ebp,%ebp                                                                       │
   │0x400402 <_start+2>                     mov    %rdx,%r9                                                                        │
   │0x400405 <_start+5>                     pop    %rsi                                                                            │
   │0x400406 <_start+6>                     mov    %rsp,%rdx                                                                       │
   │0x400409 <_start+9>                     and    $0xfffffffffffffff0,%rsp                                                        │
   │0x40040d <_start+13>                    push   %rax                                                                            │
   │0x40040e <_start+14>                    push   %rsp                                                                            │
   │0x40040f <_start+15>                    mov    $0x400560,%r8                                                                   │
   │0x400416 <_start+22>                    mov    $0x4004f0,%rcx                                                                  │
   │0x40041d <_start+29>                    mov    $0x601060,%rdi                                                                  │
   │0x400424 <_start+36>                    callq  0x4003e0 <__libc_start_main@plt>                                                │
{% endhighlight %}

From testing, I found that the value pushed on `%rdi` is the location of main, but something seems off this time. Hang on, it put main in the `.data` section! Earlier I mentioned how `.text` is where readonly executable code goes and `.data` is where non-executable read/write values go! The code is trying to run memory that is marked as non-executable which is the cause of the segfault. How am I supposed to convince the compiler that my "main" belongs in `.text`?! Well, my searches turned up empty, and I was convinced that was the end of the road. Time to call it a night and my adventure a failure.

But I couldn't sleep that night without finding a solution. I continued to search and search some more until I found a very obvious and simple solution on a stack overflow post that I've lost the URL to, sadly. All I have to do is declare the main function as `const` Changing it to `const char main[] = {` was all I needed to do to get it in the right section, so let's try compiling again.

{% highlight bash %}
$ gcc -Wall const_array_main.c -o fourth
const_array_main.c:1:12: warning: ‘main’ is usually a function [-Wmain]
 const char main[] = {
            ^
$ ./fourth
SL)�1�H��H�
{% endhighlight %}

Ack! What is it doing now! Time to gdb again and see what's happening:

{% highlight bash %}
gdb ./fourth
(gdb) break _start
(gdb) run
(gdb) layout asm
{% endhighlight %}

So looking at the code we can see the address for main is in the ASM for _start in the instruction that looks like this on my machine `mov    $0x4005a0,%rdi` We can use this to set a break point on main by doing `break *0x4005a0` and then continue execution with `c`:

{% highlight bash %}
(gdb) break *0x4005a0
(gdb) c
(gdb) x/49i $pc     # $pc is the current executing instruction
...
   0x4005a4 <main+4>:   mov    $0x1,%eax
   0x4005a9 <main+9>:   mov    $0x1,%ebx
   0x4005ae <main+14>:  mov    $0x400510,%esi
   0x4005b3 <main+19>:  mov    $0xd,%edx
   0x4005b8 <main+24>:  syscall
...
{% endhighlight %}

I snipped some of the assembly that wasn't important. If you didn't notice what went wrong, the address pushed to print at (0x400510) is not the address we stored the string "Hello world!\n" at (0x4005c3)! It's actually still pointing to the computed location in the original compiled executable and not using relative addressing to print it. That means we need to modify the assembly code in order to load the address of the string relative to the current address. As it stands, it's fairly difficult to accomplish in 32-bit code, but thankfully we are using 64-bit ASM, so we can ues the `lea` instruction to make it easier.

{% highlight c %}
void main() {
    __asm__ (
        // print Hello World
        "movl $1, %eax;\n"  /* 1 is the syscall number for write */
        "movl $1, %ebx;\n"  /* 1 is stdout and is the first argument */
        // "movl $message, %esi;\n" /* load the address of string into the second argument*/
        // instead use this to load the address of the string
        // as 16 bytes from the current instruction
        "leal 16(%eip), %esi;\n"
        "movl $13, %edx;\n"  /* third argument is the length of the string to print*/
        "syscall;\n"
        // call exit (so it doesn't try to run the string Hello World
        // maybe I could have just used ret instead
        "movl $60,%eax;\n"
        "xorl %ebx,%ebx; \n"
        "syscall;\n"
        // Store the Hello World inside the main function
        "message: .ascii \"Hello World!\\n\";"
    );
}
{% endhighlight %}

The changed code is commented so you can see it. Compiling the code and checking to see if it works:

{% highlight bash %}
$ gcc -Wall relative_str_asm.c -o fifth
relative_str_asm.c:1:6: warning: return type of ‘main’ is not ‘int’ [-Wmain]
 void main() {
      ^
$ ./fifth
Hello World!
{% endhighlight %}

And now we can use the same techniques discussed earlier to extract the hex values as an integer array. But this time, I want to make it a little bit more disguised and tricky by using the full 4 bytes that ints give me instead. We can do that by printing the information out in gdb as an int instead of dumping the hex to a file and then copy pasting it into the program.

{% highlight bash %}
gdb ./fifth
(gdb) x/13dw main
0x4004ed <main>:    -443987883  440 113408  -1922629632
0x4004fd <main+16>: 4149    899584  84869120    15544
0x40050d <main+32>: 266023168   1818576901  1461743468  1684828783
0x40051d <main+48>: -1017312735
{% endhighlight %}

I chose the number 13 since main was 49 bytes long and 49 / 4 rounds up to 13 just to be safe. Since we exit from the function early it shouldn't make a difference. Now all that's left is to copy and paste this back into our `compiled_array_main.c` and run it.

{% highlight c %}
const int main[] = {
    -443987883, 440, 113408, -1922629632,
    4149, 899584, 84869120, 15544,
    266023168, 1818576901, 1461743468, 1684828783,
    -1017312735
};
{% endhighlight %}

{% highlight bash %}
$ gcc -Wall final_array.c -o sixth
final_array.c:1:11: warning: ‘main’ is usually a function [-Wmain]
 const int main[] = {
           ^
$ ./sixth
Hello World!
{% endhighlight %}

And all this time we've been ignoring the warning message about main not being a function :)

I'm guessing all that will happen when my coworker turns in an assignment looking like this is they will take off points for bad coding style and say nothing else about it.

![Zoidberg: Warning: `main` is usually a function. Why not an int array?](https://memedad.com/memes/428595.jpg)