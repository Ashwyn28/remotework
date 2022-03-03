<script>
    import FeaturedListing from "../components/featuredListing.svelte";

    console.log("1")
</script>

<div>
    <h4 on:click={() => console.log("2")}>Your Listing</h4>
    <div>
        <h5>Job description</h5>
    </div>
    <FeaturedListing listing={"your job listing"}/>
</div>