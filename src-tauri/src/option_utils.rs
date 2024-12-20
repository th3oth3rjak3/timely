/// Check to see if an optional vec is empty when Some.
pub fn has_contents<T>(maybe: Option<&Vec<T>>) -> bool {
    match maybe {
        Some(content) => content.len() > 0,
        None => false
    }
}