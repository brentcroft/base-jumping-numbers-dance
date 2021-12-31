var SYMBOLIC_COMPOSITIONS = [
    { "clear": [] },
    { "clear": [] },
    {
        "clear": [],
        "2d-full": [
            "z_0^-1; ",
            "z_0i^-1; ",
            "z_0 + z_0i; ",
            "z_0i + z_0; "
        ]
    },
    {
        "clear": [],
        "3d-canonical": [
            "# 3d-canonical; ",

            "# a-constructions; ",
            "a_2 + b_2i; b_2 + a_2i; ",
            "a_0 + b_4; b_4i + a_0i; ",
            "a_1 + b_0; b_0i + a_1i; ",
            "",

            "# b constructions; ",
            "a_1 + a_2i; a_2i + a_1; ; a_1i + a_2; a_2 + a_1i; ",
            "a_0 + a_1i; a_1 + a_0i; a_0i + a_1; a_1i + a_0; ",
            "a_2 + a_0i; a_0 + a_2i; a_2i + a_0; a_0i + a_2; ",


            "# z constructions; ",
            "a_1 + a_2i + a_0; ",
            "a_1i + a_2 + a_0i; ",
            "a_2 + a_1i + a_0; ",
            "a_2i + a_1 + a_0i; ",
            "a_2 + a_0i + a_1; ",
            "a_2i + a_0 + a_1i; ",
        ],
        "b-commutes": [
            "# b-commutes; ",
            "b_2 + b_4i; b_4i + b_2; ",
            "b_4 + b_2i; b_2i + b_4; ",
            "b_3 + b_5i; b_5i + b_3; ",
            "b_5 + b_3i; b_3i + b_5; ",
            "b_0 + b_4; b_4 + b_0; ",
            "b_4i + b_0i; b_0i + b_4i; ",
            "b_1 + b_5; b_5 + b_1; ",
            "b_5i + b_1i; b_1i + b_5i; ",
            "b_0i + b_2; b_2 + b_0i; ",
            "b_2i + b_0; b_0 + b_2i; ",
            "b_3i + b_1; b_1 + b_3i; ",
            "b_1i + b_3; b_3 + b_1i; ",
        ],
        "b-alt": [
            "# b-commuters; ",
            "b_4i + b_2; b_2 + b_4i; b_4 + b_2; b_2 + b_4; ",
            "b_5i + b_3i; b_3i + b_5i; b_5 + b_3; b_3 + b_5; ",
            "b_4 + b_0; b_0 + b_4; b_4i + b_0i; b_0i + b_4i; ",
            "b_1 + b_3; b_3 + b_1; b_1i + b_3i; b_3i + b_1i; ",
            "b_1i + b_5i; b_5i + b_1i; b_1 + b_5; b_5 + b_1; ",
            "b_2i + b_0i; b_0i + b_2i; b_2 + b_0; b_0 + b_2; "
        ],
        "a-inner": [
            "# a-inner-identities; ",
            "# a_0;",
            "a_1 + b_4i; b_3 + a_2h; ",
            "# b_5 + a_1; # a_1h + b_4i; ",

            "# a_0i; ",
            "a_2 + b_2i; b_5 + a_1h; ",

            "# a_0i; ",
            "a_2hi + b_3i; b_4 + a_1i; ",
            "# b_4 + a_1hi; # a_1i + b_5i; ",

            "# a_0hi; ",
            "a_1hi + b_5i; b_2 + a_2i; ",

            "# a_1; ",
            "a_0 + b_4; b_1 + a_2; ",

            "# a_1h; ",
            "a_2h + b_0i; b_5i + a_0h; ",

            "# a_1i; ",
            "a_2i + b_1i; b_4i + a_0i; ",

            "# a_1hi; ",
            "a_0hi + b_5; b_0 + a_2hi; ",

            "# a_2; ",
            "a_0h + b_2; b_1i + a_1; ",

            "# a_2h; ",
            "a_1h + b_0; b_3i + a_0; ",

            "# a_2i; ",
            "a_1i + b_1; b_2i + a_0hi; ",

            "# a_2hi; ",
            "a_0i + b_3; b_0i + a_1hi; "
        ],
        "a-rotations": [
            "# a-rotation-identities; ",
            "# a_0; ",
            "a_1h + b_4i; b_3 + a_2; ",

            "# a_0ih; ",
            "a_2h + b_2i; b_5 + a_1; ",

            "# a_0i; ",
            "a_2i + b_3i; b_4 + a_1hi; ",

            "# a_0hi; ",
            "a_1i + b_5i; b_2 + a_2hi; ",

            "# a_1; ",
            "a_0h + b_4; b_1 + a_2h; ",

            "# a_1h; ",
            "a_2 + b_0i; b_5i + a_0; ",

            "# a_1i; ",
            "a_2hi + b_1i; b_4i + a_0hi; ",

            "# a_1hi; ",
            "a_0i + b_5; b_0 + a_2i; ",

            "# a_2; ",
            "a_0 + b_2; b_1i + a_1h; ",

            "# a_2h; ",
            "a_1 + b_0; b_3i + a_0h; ",

            "# a_2i; ",
            "a_1hi + b_1; b_2i + a_0i; ",

            "# a_2hi; ",
            "a_0hi + b_3; b_0i + a_1i;"
        ],
        "specials": [
            "# specials; ",
            "z_0 + b_0; ",
            "b_1 + z_1; ",
            "z_2 + b_2; ",
            "z_1 + b_4; ",
            "b_5i + z_1; ",
            "b_3i + a_2h; ",
            "a_1h + b_4i;"
        ]
    },
    { "clear": [] },
    { "clear": [] },
    { "clear": [] },
    { "clear": [] },
];
