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