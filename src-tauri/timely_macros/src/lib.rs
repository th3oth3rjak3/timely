use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, Data, DeriveInput};

#[proc_macro_derive(EnumFromString)]
pub fn enum_from_string(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let enum_name  = &input.ident;
    let data = match &input.data {
        Data::Enum(data) => data,
        _ => panic!("This macro only works for enums!"),
    };

    let variants = &data.variants;

    let match_arms = variants.iter().map(|variant| {
        let variant_name = &variant.ident;
        let variant_str = variant_name.to_string(); // convert variant name to string
        quote! {
            #variant_str => #enum_name::#variant_name,
        }
    });

    let expanded = quote! {
        impl std::convert::From<String> for #enum_name {
            fn from(s: String) -> Self {
                match s.as_str() {
                    #(#match_arms)*
                    _ => panic!("Unknown variant: {}", s), // Handle unknown string
                }
            }
        }
    };

    TokenStream::from(expanded)
}
