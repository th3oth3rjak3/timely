use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, Data, DeriveInput};

#[proc_macro_derive(SqliteTextEnum)]
pub fn sqlite_text_enum(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let name = input.ident;

    // Check if the input is an enum
    let variants = if let Data::Enum(ref data_enum) = input.data {
        &data_enum.variants
    } else {
        panic!("SqliteTextEnum can only be used with enums");
    };

    let to_sql_arms = variants.iter().map(|variant| {
        let variant_name = &variant.ident;
        quote! {
            #name::#variant_name => out.set_value(stringify!(#variant_name)),
        }
    });

    let from_sql_arms = variants.iter().map(|variant| {
        let variant_name = &variant.ident;
        quote! {
            stringify!(#variant_name) => Ok(#name::#variant_name),
        }
    });

    let expanded = quote! {
        use diesel::serialize::{ToSql, Output, IsNull};
        use diesel::deserialize::{FromSql, Result as DieselResult};
        use diesel::sqlite::Sqlite;
        use std::io::Write;

        impl diesel::serialize::ToSql<diesel::sql_types::Text, diesel::sqlite::Sqlite> for #name {
            fn to_sql<'b>(&'b self, out: &mut diesel::serialize::Output<'b, '_, diesel::sqlite::Sqlite>) -> diesel::serialize::Result {
                match self {
                    #(#to_sql_arms)*
                }
                Ok(diesel::serialize::IsNull::No)
            }
        }

        impl diesel::deserialize::FromSql<diesel::sql_types::Text, diesel::sqlite::Sqlite> for #name {
            fn from_sql(bytes: <diesel::sqlite::Sqlite as diesel::backend::Backend>::RawValue<'_>) -> diesel::deserialize::Result<Self> {
                let s: String = diesel::deserialize::FromSql::<diesel::sql_types::Text, diesel::sqlite::Sqlite>::from_sql(bytes)?;
                match s.as_str() {
                    #(#from_sql_arms)*
                    variant => Err(stringify!("Unknown variant {} for {}", variant, #name.).into())
                }
            }
        }
    };

    TokenStream::from(expanded)
}
