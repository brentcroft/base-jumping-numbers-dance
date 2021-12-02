var SYMBOLIC_COMPOSITIONS = [
    { "clear": [] },
    { "clear": [] },
    { "clear": [], "2d-full": [ "z_0^-1" ] },
    {
        "clear": [],
        "3d-0-full": [
            "# 3d-0-full ;",

            "e * a_0; e * a_1; e * a_2;",
            "a_0^-1; a_1^-1; a_2^-1;",

            "a_1 * a_0; a_0i * a_1i;",
            "a_1 * a_2; a_2i * a_1i;",
            "a_0 * a_1;  a_1i * a_0i;",
            "a_2 * a_1; a_1i * a_2i;",
            "a_0 * a_2i; a_2 * a_0i;",
            "a_0i * a_2; a_2i * a_0;",

            "a_0 * a_1 * a_2; a_2i * a_0 * a_1; a_1 * a_2 * a_0i;",
            "a_2 * a_0i * a_1i; a_1i * a_2i * a_0;",
            "a_0i * a_1i * a_2i"
        ],

        "3d-1-full": [
            "# 3d-1-full ;",
            "e * a_0; e * a_1; e * a_2;",
            "a_0^-1; a_1^-1; a_2^-1;",

            "a_0 * a_1; a_0i * a_1i; a_1 * a_0; a_1i * a_0i;",
            "a_2 * a_0; a_2i * a_0i; a_0 * a_2; a_0i * a_2i;",
            "a_2 * a_1i; a_2i * a_1; a_1 * a_2i; a_1i * a_2;",

            "a_1 * a_0 * a_2; a_0 * a_2 * a_1i; a_2i * a_1 * a_0;",
            "a_1i * a_0i * a_2i; a_0i * a_2i * a_1; a_2 * a_1i * a_0i;"
        ],


        "3d-2-full": [
            "# 3d-2-full ;",
            "# base;",
            "e * a_0; e * a_1; e * a_2;",
            "a_0^-1; a_1^-1; a_2^-1;",

            "# mix;",
            "a_1 * a_2; a_2i * a_1i; a_2 * a_1; a_1i * a_2i;",
            "a_1i * a_0; a_1 * a_0i; a_0i * a_1; a_0 * a_1i;",
            "a_0 * a_2; a_2 * a_0; a_0i * a_2i; a_2i * a_0i;",

            "# top;",
            "a_1 * a_2 * a_0; a_0i * a_2i * a_1i;",
            "a_2 * a_1 * a_0i; a_0 * a_1i * a_2i;",
            "a_2 * a_0 * a_1i; a_1 * a_0i * a_2i;"
        ],

    },
    { "clear": [] },
    { "clear": [] },
    { "clear": [] },
    { "clear": [] },
];
