const char main[] = {
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